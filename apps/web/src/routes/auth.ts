/**
 * Auth routes: /auth/*
 * Handles login, logout, register (org creation), invite acceptance,
 * password reset, and org switching.
 */

import { Hono } from 'hono';
import { html, raw } from 'hono/html';
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
      isVerified:  user.is_verified === 1,
    });

    const token = await signToken(payload, c.env.JWT_SECRET);

    // Check if API request (mobile)
    const isApi = c.req.path.startsWith('/api/') ||
      (c.req.header('Accept') ?? '').includes('application/json');

    if (isApi) {
      return c.json({ token, user: { id: user.id, email: user.email, name: user.full_name, isVerified: user.is_verified === 1 } });
    }

    setCookie(c, 'auth_token', token, COOKIE_OPTS);

    if (!user.is_verified) {
      return c.redirect('/auth/verify');
    }

    return c.redirect('/portal');
  },
);

// ── Verification ──────────────────────────────────────────────────────────────
auth.get('/verify', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.isVerified) return c.redirect('/portal');

  const csrf = await generateCsrfToken(c);
  const { VerifyPage } = await import('../views/auth/verify.js');
  return c.html(await VerifyPage({
    csrfToken: csrf,
    email: user.email,
    error: c.req.query('error'),
    success: c.req.query('success'),
  }));
});

auth.post('/verify', authMiddleware, csrfMiddleware, async (c) => {
  const user = c.get('user');
  if (user.isVerified) return c.redirect('/portal');

  const { code } = await c.req.parseBody<{ code: string }>();
  if (!code || code.length !== 6) {
    return c.redirect('/auth/verify?error=Invalid code format');
  }

  const storedCode = await c.env.KV.get(`verify:${user.sub}`);
  if (!storedCode) {
    return c.redirect('/auth/verify?error=Code expired or not found');
  }

  if (storedCode !== code) {
    return c.redirect('/auth/verify?error=Incorrect code');
  }

  // 1. Update DB
  const { verifyUser } = await import('../db/queries/users.js');
  await verifyUser(c.env.DB, user.sub);

  // 2. Issue new JWT
  const payload = buildPayload({
    ...user,
    isVerified: true,
  });
  const token = await signToken(payload, c.env.JWT_SECRET);
  setCookie(c, 'auth_token', token, COOKIE_OPTS);

  // 3. Delete code from KV
  await c.env.KV.delete(`verify:${user.sub}`);

  return c.redirect('/portal');
});

auth.post('/resend-code', authMiddleware, csrfMiddleware, async (c) => {
  const user = c.get('user');
  if (user.isVerified) return c.redirect('/portal');

  // Rate limit resend (60 seconds)
  const lastResend = await c.env.KV.get(`resend_limit:${user.sub}`);
  if (lastResend) {
    return c.redirect('/auth/verify?error=Please wait 60 seconds before resending');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const { verificationEmailHtml } = await import('../lib/email.js');

  // Store in KV (390 minutes = 23400 secs)
  await c.env.KV.put(`verify:${user.sub}`, code, { expirationTtl: 390 * 60 });
  await c.env.KV.put(`resend_limit:${user.sub}`, '1', { expirationTtl: 60 });

  await sendEmail(
    { to: user.email, subject: `${code} is your EQBIS verification code`, html: verificationEmailHtml({ code }) },
    c.env,
  );

  return c.redirect('/auth/verify?success=Verification code resent');
});

// ── Logout ────────────────────────────────────────────────────────────────────
auth.on(['GET', 'POST'], '/logout', authMiddleware, async (c) => {
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

    // Create user + org + membership in a single atomic batch
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO users (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)').bind(userId, data.email.toLowerCase().trim(), data.fullName, hash),
      c.env.DB.prepare('INSERT INTO organizations (id, name, slug, emp_id_prefix, timezone) VALUES (?, ?, ?, ?, ?)').bind(orgId, data.orgName, data.orgSlug, 'EMP', 'UTC'),
      c.env.DB.prepare('INSERT INTO org_members (id, org_id, user_id, primary_role_id) VALUES (?, ?, ?, ?)').bind(ulid(), orgId, userId, 'role_admin'),
      c.env.DB.prepare('INSERT INTO user_roles (user_id, org_id, role_id) VALUES (?, ?, ?)').bind(userId, orgId, 'role_admin'),
      c.env.DB.prepare('UPDATE organizations SET owner_id = ? WHERE id = ?').bind(userId, orgId),
    ]);

    await logActivity(c.env.DB, { orgId, userId, action: 'registered', module: 'auth', ip: c.req.header('CF-Connecting-IP') });

    // Generate Verification Code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { verificationEmailHtml } = await import('../lib/email.js');

    // Store in KV (390 minutes = 23400 secs)
    await c.env.KV.put(`verify:${userId}`, code, { expirationTtl: 390 * 60 });

    await sendEmail(
      { to: data.email, subject: `${code} is your EQBIS verification code`, html: verificationEmailHtml({ code }) },
      c.env,
    );

    // Auto-login (but restricted)
    const permissions = await getUserPermissions(c.env.DB, userId, orgId);
    const payload = buildPayload({
      sub: userId, email: data.email, name: data.fullName,
      orgId, orgSlug: data.orgSlug, roles: ['role_admin'], permissions, photo: null,
      isVerified: false,
    });
    const token = await signToken(payload, c.env.JWT_SECRET);
    setCookie(c, 'auth_token', token, COOKIE_OPTS);
    return c.redirect('/auth/verify');
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
    isVerified: current.isVerified,
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
    isVerified: current.isVerified,
  });

  const token = await signToken(payload, c.env.JWT_SECRET);
  return c.json({ token });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
auth.get('/forgot-password', async (c) => {
  const csrf = await generateCsrfToken(c);
  const sent = c.req.query('sent') === '1';

  return c.html(html`<!DOCTYPE html>
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
    <div class="text-center space-y-1">
      <a href="/"><img src="/images/logo.png" alt="EQBIS" class="w-12 h-12 mx-auto mb-4 hover:opacity-80 transition-opacity"></a>
      <h1 class="text-2xl font-bold text-[var(--text)]">Reset your password</h1>
      <p class="text-sm text-[var(--text-muted)]">We will send a link to your email</p>
    </div>

    ${sent ? html`
    <div class="px-3 py-3 rounded border border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-center gap-2">
      <span>&#10003;</span> If that account exists, an email has been sent.
    </div>` : ''}

    <form method="POST" class="space-y-4">
      ${raw(csrfField(csrf))}
      <input name="email" type="email" required placeholder="Your email"
        class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      <button type="submit" class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
        Send reset link
      </button>
    </form>
    <p class="text-center text-sm text-[var(--text-muted)]"><a href="/auth/login" class="text-[var(--accent)] hover:underline">Back to login</a></p>
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
        c.env,
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
  return c.html(html`<!DOCTYPE html>
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
    <div class="text-center space-y-1">
      <a href="/"><img src="/images/logo.png" alt="EQBIS" class="w-12 h-12 mx-auto mb-4 hover:opacity-80 transition-opacity"></a>
      <h1 class="text-2xl font-bold text-[var(--text)]">Set new password</h1>
      <p class="text-sm text-[var(--text-muted)]">Please choose a strong password</p>
    </div>
    <form method="POST" class="space-y-4">
      ${raw(csrfField(csrf))}
      <input type="hidden" name="token" value="${token}">
      <input name="password" type="password" required placeholder="New password (min 8 chars)"
        class="w-full h-10 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]">
      <button type="submit" class="w-full h-10 rounded bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
        Update password
      </button>
    </form>
    <p class="text-center text-sm text-[var(--text-muted)]"><a href="/auth/login" class="text-[var(--accent)] hover:underline">Cancel</a></p>
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
      const { verifyUser } = await import('../db/queries/users.js');
      await verifyUser(c.env.DB, userId);
      user = await getUserById(c.env.DB, userId) as NonNullable<typeof user>;
    } else {
      await updatePassword(c.env.DB, user.id, hash);
      const { verifyUser } = await import('../db/queries/users.js');
      await verifyUser(c.env.DB, user.id);
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
      isVerified: true,
    });
    const jwtToken = await signToken(payload, c.env.JWT_SECRET);
    setCookie(c, 'auth_token', jwtToken, COOKIE_OPTS);
    return c.redirect('/portal');
  },
);

export default auth;
