/**
 * Auth routes: /auth/*
 * Handles login, logout, register (org creation), invite acceptance,
 * password reset, and org switching.
 */

import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env.js';
import { signToken, buildPayload } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { ulid, uuid } from '../lib/id.js';
import { sendEmail, inviteEmailHtml, passwordResetEmailHtml } from '../lib/email.js';
import {
  LoginSchema, RegisterSchema, ForgotPasswordSchema,
  ResetPasswordSchema, SwitchOrgSchema, InviteAcceptSchema,
} from '../lib/schemas.js';
import {
  getUserByEmail, getUserById, createUser,
  getUserPermissions, getUserRoleIds, updatePassword,
} from '../db/queries/users.js';
import {
  getOrgById, getOrgBySlug, createOrg, addMember, getUserOrgs, logActivity,
} from '../db/queries/orgs.js';
import { authMiddleware, type AuthVariables } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { generateCsrfToken, csrfField, csrfMiddleware } from '../middleware/csrf.js';

// Shared Hono env type
type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const auth = new Hono<HonoEnv>();

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   true,
  sameSite: 'Lax' as const,
  path:     '/',
  maxAge:   604800,  // 7 days
};

// ── Login ──────────────────────────────────────────────────────────────────────
auth.get('/login', async (c) => {
  const csrf = await generateCsrfToken(c);
  const { LoginPage } = await import('../views/auth/login.js');
  return c.html(await LoginPage({ csrfToken: csrf, error: c.req.query('error'), baseUrl: c.env.APP_URL }));
});

auth.post(
  '/login',
  rateLimit({ prefix: 'rl:auth:login', window: 60, limit: 10 }),
  csrfMiddleware,
  zValidator('form', LoginSchema, (result, c) => {
    if (!result.success) {
      return c.redirect('/auth/login?error=invalid');
    }
  }),
  async (c) => {
    const { email, password } = c.req.valid('form');

    const user = await getUserByEmail(c.env.DB, email);
    if (!user || !user.password_hash) {
      return c.redirect('/auth/login?error=invalid');
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.redirect('/auth/login?error=invalid');
    }

    if (!user.is_active) {
      return c.redirect('/auth/login?error=inactive');
    }

    // Load org membership — use first org
    const orgs = await getUserOrgs(c.env.DB, user.id);
    if (orgs.length === 0) {
      return c.redirect('/auth/login?error=no_org');
    }

    const org = await getOrgById(c.env.DB, orgs[0].org_id);
    if (!org) return c.redirect('/auth/login?error=no_org');

    const permissions = await getUserPermissions(c.env.DB, user.id, org.id);
    const roles       = await getUserRoleIds(c.env.DB, user.id, org.id);

    const payload = buildPayload({
      sub:         user.id,
      email:       user.email,
      name:        user.full_name,
      orgId:       org.id,
      orgSlug:     org.slug,
      roles,
      permissions,
      photo:       user.photo_key ?? null,
    });

    const token = await signToken(payload, c.env.JWT_SECRET);

    // Check if API request (mobile)
    const isApi = c.req.path.startsWith('/api/') ||
      (c.req.header('Accept') ?? '').includes('application/json');

    if (isApi) {
      return c.json({ token, user: { id: user.id, email: user.email, name: user.full_name } });
    }

    setCookie(c, 'auth_token', token, COOKIE_OPTS);
    return c.redirect('/portal');
  },
);

// ── Logout ────────────────────────────────────────────────────────────────────
auth.post('/logout', authMiddleware, async (c) => {
  const user = c.get('user');
  // Revoke JTI in KV (TTL = remaining lifetime of the token)
  const remaining = user.exp - Math.floor(Date.now() / 1000);
  if (remaining > 0) {
    await c.env.KV.put(`revoked:${user.jti}`, '1', { expirationTtl: remaining });
  }
  deleteCookie(c, 'auth_token', { path: '/' });
  return c.redirect('/auth/login');
});

// ── Register (creates org + admin user) ───────────────────────────────────────
auth.get('/register', async (c) => {
  const csrf = await generateCsrfToken(c);
  const { SignupPage } = await import('../views/auth/signup.js');
  return c.html(await SignupPage({ csrfToken: csrf, error: c.req.query('error'), baseUrl: c.env.APP_URL }));
});

auth.post(
  '/register',
  rateLimit({ prefix: 'rl:auth:register', window: 300, limit: 5 }),
  csrfMiddleware,
  zValidator('form', RegisterSchema, (result, c) => {
    if (!result.success) {
      const msg = result.error.issues[0].message;
      return c.redirect(`/auth/register?error=${encodeURIComponent(msg)}`);
    }
  }),
  async (c) => {
    const data = c.req.valid('form');

    // Check duplicate email
    const existing = await getUserByEmail(c.env.DB, data.email);
    if (existing) {
      return c.redirect('/auth/register?error=email_taken');
    }

    // Check slug uniqueness
    const existingOrg = await getOrgBySlug(c.env.DB, data.orgSlug);
    if (existingOrg) {
      return c.redirect('/auth/register?error=slug_taken');
    }

    const userId = ulid();
    const orgId  = ulid();
    const hash   = await hashPassword(data.password);

    // Create user + org + membership in a single logical transaction
    await createUser(c.env.DB, {
      id: userId, email: data.email, full_name: data.fullName, password_hash: hash,
    });

    await createOrg(c.env.DB, {
      id: orgId, name: data.orgName, slug: data.orgSlug, emp_id_prefix: 'EMP',
    });

    await addMember(c.env.DB, {
      id: ulid(), orgId, userId, roleId: 'role_admin',
    });

    // Update org owner
    await c.env.DB
      .prepare('UPDATE organizations SET owner_id = ? WHERE id = ?')
      .bind(userId, orgId)
      .run();

    await logActivity(c.env.DB, { orgId, userId, action: 'registered', module: 'auth', ip: c.req.header('CF-Connecting-IP') });

    // Auto-login
    const permissions = await getUserPermissions(c.env.DB, userId, orgId);
    const payload = buildPayload({
      sub: userId, email: data.email, name: data.fullName,
      orgId, orgSlug: data.orgSlug, roles: ['role_admin'], permissions, photo: null,
    });
    const token = await signToken(payload, c.env.JWT_SECRET);
    setCookie(c, 'auth_token', token, COOKIE_OPTS);
    return c.redirect('/portal');
  },
);

// ── Switch Org ────────────────────────────────────────────────────────────────
auth.post('/switch-org', authMiddleware, zValidator('json', SwitchOrgSchema), async (c) => {
  const { orgId: newOrgId } = c.req.valid('json');
  const current = c.get('user');

  // Verify membership
  const member = await c.env.DB
    .prepare('SELECT 1 FROM org_members WHERE user_id = ? AND org_id = ? LIMIT 1')
    .bind(current.sub, newOrgId)
    .first();

  if (!member) return c.json({ error: 'Not a member of that organisation' }, 403);

  const org  = await getOrgById(c.env.DB, newOrgId);
  if (!org)   return c.json({ error: 'Organisation not found' }, 404);

  const permissions = await getUserPermissions(c.env.DB, current.sub, newOrgId);
  const roles       = await getUserRoleIds(c.env.DB, current.sub, newOrgId);

  const payload = buildPayload({
    sub: current.sub, email: current.email, name: current.name,
    orgId: org.id, orgSlug: org.slug, roles, permissions, photo: current.photo,
  });

  const token = await signToken(payload, c.env.JWT_SECRET);

  const isApi = (c.req.header('Accept') ?? '').includes('application/json');
  if (isApi) return c.json({ token });

  // Revoke old token
  const remaining = current.exp - Math.floor(Date.now() / 1000);
  if (remaining > 0) {
    await c.env.KV.put(`revoked:${current.jti}`, '1', { expirationTtl: remaining });
  }

  setCookie(c, 'auth_token', token, COOKIE_OPTS);
  return c.redirect('/portal');
});

// ── Token Refresh (for mobile) ────────────────────────────────────────────────
auth.post('/refresh', authMiddleware, async (c) => {
  const current = c.get('user');
  const now = Math.floor(Date.now() / 1000);

  // Only refresh if within 24h of expiry
  if (current.exp - now > 86400) {
    return c.json({ error: 'Token not due for refresh yet' }, 400);
  }

  const payload = buildPayload({
    sub: current.sub, email: current.email, name: current.name,
    orgId: current.orgId, orgSlug: current.orgSlug,
    roles: current.roles, permissions: current.permissions, photo: current.photo,
  });

  const token = await signToken(payload, c.env.JWT_SECRET);
  return c.json({ token });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
auth.get('/forgot-password', async (c) => {
  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head><meta charset="utf-8"><title>Forgot Password — EQBIS</title>
<meta property="og:type" content="website">
<meta property="og:title" content="Forgot Password — EQBIS">
<meta property="og:image" content="${c.env.APP_URL}/images/logo.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Forgot Password — EQBIS">
<meta name="twitter:image" content="${c.env.APP_URL}/images/logo.png">
<link rel="icon" type="image/png" href="/images/logo.png">
<link rel="apple-touch-icon" href="/images/logo.png">
<link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen flex items-center justify-center bg-[var(--bg)]">
  <div class="w-full max-w-sm space-y-6 p-8">
    <h1 class="text-2xl font-bold text-[var(--text)]">Reset your password</h1>
    <form method="POST" class="space-y-4">
      ${csrfField(csrf)}
      <input name="email" type="email" required placeholder="Your email"
        class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm">
      <button type="submit" class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm">
        Send reset link
      </button>
    </form>
    <p class="text-center text-sm text-[var(--text-muted)]"><a href="/auth/login" class="text-[var(--accent)]">Back to login</a></p>
  </div>
</body></html>`);
});

auth.post(
  '/forgot-password',
  rateLimit({ prefix: 'rl:auth:reset', window: 300, limit: 5 }),
  csrfMiddleware,
  zValidator('form', ForgotPasswordSchema),
  async (c) => {
    const { email } = c.req.valid('form');
    const user = await getUserByEmail(c.env.DB, email);

    // Always return success to prevent user enumeration
    if (user) {
      const token = uuid();
      await c.env.KV.put(`reset:${token}`, user.id, { expirationTtl: 3600 });

      const link = `${c.env.APP_URL}/auth/reset-password?token=${token}`;
      await sendEmail(
        { to: email, subject: 'Reset your EQBIS password', html: passwordResetEmailHtml({ link }) },
        c.env.RESEND_API_KEY,
      );
    }

    return c.redirect('/auth/forgot-password?sent=1');
  },
);

// ── Reset Password ────────────────────────────────────────────────────────────
auth.get('/reset-password', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.redirect('/auth/login');

  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head><meta charset="utf-8"><title>Reset Password — EQBIS</title>
<meta property="og:type" content="website">
<meta property="og:title" content="Reset Password — EQBIS">
<meta property="og:image" content="${c.env.APP_URL}/images/logo.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Reset Password — EQBIS">
<meta name="twitter:image" content="${c.env.APP_URL}/images/logo.png">
<link rel="icon" type="image/png" href="/images/logo.png">
<link rel="apple-touch-icon" href="/images/logo.png">
<link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen flex items-center justify-center bg-[var(--bg)]">
  <div class="w-full max-w-sm space-y-6 p-8">
    <h1 class="text-2xl font-bold text-[var(--text)]">Set new password</h1>
    <form method="POST" class="space-y-4">
      ${csrfField(csrf)}
      <input type="hidden" name="token" value="${token}">
      <input name="password" type="password" required placeholder="New password (min 8 chars)"
        class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm">
      <button type="submit" class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm">
        Update password
      </button>
    </form>
  </div>
</body></html>`);
});

auth.post(
  '/reset-password',
  csrfMiddleware,
  zValidator('form', ResetPasswordSchema),
  async (c) => {
    const { token, password } = c.req.valid('form');
    const userId = await c.env.KV.get(`reset:${token}`);
    if (!userId) return c.redirect('/auth/reset-password?error=invalid');

    const hash = await hashPassword(password);
    await updatePassword(c.env.DB, userId, hash);
    await c.env.KV.delete(`reset:${token}`);

    return c.redirect('/auth/login?reset=1');
  },
);

// ── Accept Invite ─────────────────────────────────────────────────────────────
auth.get('/invite', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.redirect('/auth/login');

  const raw = await c.env.KV.get(`invite:${token}`);
  if (!raw) {
    return c.html('<p>Invite link is invalid or has expired. Please contact your administrator.</p>', 400);
  }

  const invite = JSON.parse(raw) as { email: string; orgId: string; roleId: string };
  const csrf = await generateCsrfToken(c);

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head><meta charset="utf-8"><title>Accept Invite — EQBIS</title>
<meta property="og:type" content="website">
<meta property="og:title" content="Accept Invite — EQBIS">
<meta property="og:image" content="${c.env.APP_URL}/images/logo.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Accept Invite — EQBIS">
<meta name="twitter:image" content="${c.env.APP_URL}/images/logo.png">
<link rel="icon" type="image/png" href="/images/logo.png">
<link rel="apple-touch-icon" href="/images/logo.png">
<link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen flex items-center justify-center bg-[var(--bg)]">
  <div class="w-full max-w-sm space-y-6 p-8">
    <h1 class="text-2xl font-bold text-[var(--text)]">Set up your account</h1>
    <p class="text-sm text-[var(--text-muted)]">You've been invited to join. Set your name and password to continue.</p>
    <form method="POST" class="space-y-4">
      ${csrfField(csrf)}
      <input type="hidden" name="token" value="${token}">
      <input name="fullName" type="text" required placeholder="Your full name"
        class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm">
      <input name="password" type="password" required placeholder="Create a password"
        class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm">
      <button type="submit" class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm">
        Create Account
      </button>
    </form>
  </div>
</body></html>`);
});

auth.post(
  '/invite',
  csrfMiddleware,
  zValidator('form', InviteAcceptSchema),
  async (c) => {
    const { token, password, fullName } = c.req.valid('form');

    const raw = await c.env.KV.get(`invite:${token}`);
    if (!raw) return c.html('<p>Invalid or expired invite.</p>', 400);

    const invite = JSON.parse(raw) as { email: string; orgId: string; roleId: string; invitedBy: string };

    // Check if user already exists (re-invite case)
    let user = await getUserByEmail(c.env.DB, invite.email);
    const hash = await hashPassword(password);

    if (!user) {
      const userId = ulid();
      await createUser(c.env.DB, { id: userId, email: invite.email, full_name: fullName, password_hash: hash });
      user = await getUserById(c.env.DB, userId) as NonNullable<typeof user>;
    } else {
      await updatePassword(c.env.DB, user.id, hash);
    }

    await addMember(c.env.DB, { id: ulid(), orgId: invite.orgId, userId: user.id, roleId: invite.roleId });
    await c.env.KV.delete(`invite:${token}`);

    await logActivity(c.env.DB, { orgId: invite.orgId, userId: user.id, action: 'accepted_invite', module: 'auth' });

    // Auto-login
    const org = await getOrgById(c.env.DB, invite.orgId);
    if (!org) return c.redirect('/auth/login');

    const permissions = await getUserPermissions(c.env.DB, user.id, org.id);
    const payload = buildPayload({
      sub: user.id, email: user.email, name: fullName,
      orgId: org.id, orgSlug: org.slug, roles: [invite.roleId], permissions, photo: null,
    });
    const jwtToken = await signToken(payload, c.env.JWT_SECRET);
    setCookie(c, 'auth_token', jwtToken, COOKIE_OPTS);
    return c.redirect('/portal');
  },
);

export default auth;
