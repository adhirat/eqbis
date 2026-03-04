/**
 * Users management routes — /portal/users
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../types/env.js';
import type { AuthVariables } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import { requirePermission } from '../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../middleware/csrf.js';
import { ulid } from '../../lib/id.js';
import { hashPassword } from '../../lib/password.js';
import { sendEmail, inviteEmailHtml } from '../../lib/email.js';
import { CreateUserSchema, AssignRoleSchema } from '../../lib/schemas.js';
import {
  getOrgUsers, getUserById, createUser, updateUser,
} from '../../db/queries/users.js';
import { addMember, logActivity, getUserOrgs } from '../../db/queries/orgs.js';
import { getOrgRoles, assignRoleToUser } from '../../db/queries/roles.js';
import { isApi } from '../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const users = new Hono<HonoEnv>();

// List users
users.get('/', requirePermission(PERMISSIONS.VIEW_USERS), async (c) => {
  const { orgId } = c.get('user');
  const rows = await getOrgUsers(c.env.DB, orgId);
  if (isApi(c)) return c.json({ users: rows });

  const roles = await getOrgRoles(c.env.DB, orgId);
  const csrf = await generateCsrfToken(c);

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Users — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]">
<!-- Full portal layout is applied by the portal index router -->
<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-lg font-bold text-[var(--text)]">Users</h2>
      <p class="text-sm text-[var(--text-muted)]">${rows.length} team members</p>
    </div>
    <button onclick="document.getElementById('invite-modal').classList.remove('hidden')"
      class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium">
      + Invite User
    </button>
  </div>

  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Name</th>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Email</th>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Role</th>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Status</th>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${rows.map(u => `
        <tr>
          <td class="px-4 py-2.5 text-[var(--text)] font-medium">${u.full_name}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${u.email}</td>
          <td class="px-4 py-2.5">
            ${u.role_name ? `<span class="px-2 py-0.5 rounded text-[11px] font-medium" style="background:${u.role_color}20;color:${u.role_color}">${u.role_name}</span>` : '<span class="text-[var(--text-muted)] text-xs">None</span>'}
          </td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium ${u.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}">
              ${u.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="px-4 py-2.5">
            <a href="/portal/users/${u.id}" class="text-xs text-[var(--accent)] hover:underline">View</a>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Invite modal -->
  <div id="invite-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/60" onclick="document.getElementById('invite-modal').classList.add('hidden')"></div>
    <div class="relative z-10 w-full max-w-md mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      <h3 class="font-semibold text-[var(--text)]">Invite User</h3>
      <form method="POST" action="/portal/users/invite" class="space-y-4">
        <input type="hidden" name="_csrf" value="${csrf}">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Email</label>
          <input name="email" type="email" required placeholder="colleague@company.com"
            class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Full Name</label>
          <input name="fullName" type="text" required placeholder="Jane Smith"
            class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Role</label>
          <select name="roleId" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
            ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
          </select>
        </div>
        <div class="flex gap-2 pt-2">
          <button type="button" onclick="document.getElementById('invite-modal').classList.add('hidden')"
            class="flex-1 h-9 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button type="submit" class="flex-1 h-9 rounded bg-[var(--accent)] text-white font-medium text-sm">Send Invite</button>
        </div>
      </form>
    </div>
  </div>
</div>
</body></html>`);
});

// Invite user (send email with invite link)
users.post(
  '/invite',
  requirePermission(PERMISSIONS.CREATE_USER),
  csrfMiddleware,
  zValidator('form', CreateUserSchema),
  async (c) => {
    const { email, fullName, roleId } = c.req.valid('form');
    const { orgId, sub: invitedBy } = c.get('user');

    const token = ulid();
    const invite = { email, orgId, roleId, invitedBy };
    await c.env.KV.put(`invite:${token}`, JSON.stringify(invite), { expirationTtl: 172800 }); // 48h

    const link = `${c.env.APP_URL}/auth/invite?token=${token}`;
    await sendEmail(
      { to: email, subject: 'You have been invited to EQBIS', html: inviteEmailHtml({ name: fullName, orgName: orgId, link }) },
      c.env,
    );

    await logActivity(c.env.DB, {
      id: ulid(), orgId, userId: invitedBy, action: 'invited_user', module: 'users',
      details: { email },
    });

    return c.redirect('/portal/users?invited=1');
  },
);

// View user
users.get('/:id', requirePermission(PERMISSIONS.VIEW_USERS), async (c) => {
  const { orgId } = c.get('user');
  const user = await getUserById(c.env.DB, c.req.param('id'), orgId);
  if (!user) return c.json({ error: 'Not found' }, 404);
  return isApi(c) ? c.json({ user }) : c.html(`<div class="p-6 h-full flex flex-col items-center justify-center space-y-4">
    <div class="h-20 w-20 rounded-full bg-[var(--accent)] flex items-center justify-center text-3xl font-bold text-white uppercase">
      ${user.full_name[0]}
    </div>
    <div class="text-center">
      <h2 class="text-xl font-bold">${user.full_name}</h2>
      <p class="text-[var(--text-muted)]">${user.email}</p>
    </div>
    <div class="flex gap-2">
      <a href="/portal/users" class="px-4 py-2 rounded border border-[var(--border)] text-sm">Back to users</a>
    </div>
  </div>`);
});

// Assign role
users.post(
  '/:id/role',
  requirePermission(PERMISSIONS.ASSIGN_ROLES),
  csrfMiddleware,
  zValidator('form', AssignRoleSchema),
  async (c) => {
    const { orgId, sub: adminId } = c.get('user');
    const { roleId } = c.req.valid('form');
    const userId = c.req.param('id');

    await assignRoleToUser(c.env.DB, { userId, orgId, roleId });
    await logActivity(c.env.DB, {
      id: ulid(), orgId, userId: adminId, action: 'assigned_role', module: 'users',
      entityId: userId, details: { roleId },
    });

    return isApi(c) ? c.json({ ok: true }) : c.redirect(`/portal/users/${userId}`);
  },
);

// Deactivate user
users.post(
  '/:id/deactivate',
  requirePermission(PERMISSIONS.EDIT_USER),
  csrfMiddleware,
  async (c) => {
    const { orgId, sub: adminId } = c.get('user');
    const userId = c.req.param('id');

    await updateUser(c.env.DB, userId, { is_active: 0 }, orgId);
    await logActivity(c.env.DB, {
      id: ulid(), orgId, userId: adminId, action: 'deactivated_user', module: 'users', entityId: userId,
    });

    return isApi(c) ? c.json({ ok: true }) : c.redirect('/portal/users');
  },
);

export default users;
