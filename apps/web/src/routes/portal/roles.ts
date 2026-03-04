/**
 * Roles management routes — /portal/roles
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../types/env.js';
import type { AuthVariables } from '../../middleware/auth.js';
import { PERMISSIONS, ALL_PERMISSIONS } from '../../lib/permissions.js';
import { requirePermission } from '../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../middleware/csrf.js';
import { ulid } from '../../lib/id.js';
import { CreateRoleSchema, UpdateRoleSchema } from '../../lib/schemas.js';
import { getOrgRoles, getRoleById, getRolePermissions, createRole, updateRole, deleteRole, setRolePermissions } from '../../db/queries/roles.js';
import { logActivity } from '../../db/queries/orgs.js';
import { isApi } from '../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const roles = new Hono<HonoEnv>();

roles.get('/', requirePermission(PERMISSIONS.VIEW_ROLES), async (c) => {
  const { orgId } = c.get('user');
  const rows = await getOrgRoles(c.env.DB, orgId);
  if (isApi(c)) return c.json({ roles: rows });

  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Roles — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-[var(--text)]">Roles & Permissions</h2>
    <button onclick="document.getElementById('create-role-modal').classList.remove('hidden')"
      class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium">+ Create Role</button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    ${rows.map(r => `
    <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full" style="background:${r.color}"></div>
        <h3 class="font-semibold text-[var(--text)]">${r.name}</h3>
        ${r.is_default ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-muted)]">Default</span>' : ''}
        <span class="ml-auto text-xs text-[var(--text-muted)]">${r.member_count ?? 0} members</span>
      </div>
      <div class="flex gap-2">
        <a href="/portal/roles/${r.id}" class="text-xs text-[var(--accent)] hover:underline">View Permissions</a>
        ${!r.is_default ? `
        <form method="POST" action="/portal/roles/${r.id}/delete" onsubmit="return confirm('Delete this role?')">
          <input type="hidden" name="_csrf" value="${csrf}">
          <button type="submit" class="text-xs text-red-400 hover:underline">Delete</button>
        </form>` : ''}
      </div>
    </div>`).join('')}
  </div>

  <!-- Create role modal -->
  <div id="create-role-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/60" onclick="document.getElementById('create-role-modal').classList.add('hidden')"></div>
    <div class="relative z-10 w-full max-w-md mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      <h3 class="font-semibold text-[var(--text)]">Create Role</h3>
      <form method="POST" action="/portal/roles" class="space-y-4">
        <input type="hidden" name="_csrf" value="${csrf}">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Role Name</label>
          <input name="name" type="text" required placeholder="e.g. Accountant"
            class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
          <input name="description" type="text" placeholder="Brief description"
            class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Color</label>
          <input name="color" type="color" value="#6B7280" class="h-9 w-16 rounded border border-[var(--border)]">
        </div>
        <div class="flex gap-2 pt-2">
          <button type="button" onclick="document.getElementById('create-role-modal').classList.add('hidden')"
            class="flex-1 h-9 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button type="submit" class="flex-1 h-9 rounded bg-[var(--accent)] text-white font-medium text-sm">Create</button>
        </div>
      </form>
    </div>
  </div>
</div></body></html>`);
});

roles.post(
  '/',
  requirePermission(PERMISSIONS.CREATE_ROLE),
  csrfMiddleware,
  zValidator('form', CreateRoleSchema),
  async (c) => {
    const { orgId, sub: userId } = c.get('user');
    const data = c.req.valid('form');
    const id = ulid();
    await createRole(c.env.DB, { id, orgId, name: data.name, description: data.description, color: data.color });
    if (data.permissions.length) await setRolePermissions(c.env.DB, id, data.permissions as any[]);
    await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'created_role', module: 'roles', entityId: id });
    return isApi(c) ? c.json({ id }) : c.redirect('/portal/roles');
  },
);

roles.get('/:id', requirePermission(PERMISSIONS.VIEW_ROLES), async (c) => {
  const { orgId } = c.get('user');
  const role = await getRoleById(c.env.DB, c.req.param('id'), orgId);
  if (!role) return c.json({ error: 'Not found' }, 404);
  const perms = await getRolePermissions(c.env.DB, role.id);
  if (isApi(c)) return c.json({ role, permissions: perms });

  const csrf = await generateCsrfToken(c);
  const permSet = new Set(perms);

  // Group permissions by category
  const groups: Record<string, string[]> = {};
  for (const p of ALL_PERMISSIONS) {
    const cat = p.split('_').slice(1).join('_') || p;
    const group = p.split('_')[0];
    if (!groups[group]) groups[group] = [];
    groups[group].push(p);
  }

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>${role.name} Role — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center gap-3">
    <a href="/portal/roles" class="text-[var(--text-muted)] hover:text-[var(--text)]">← Roles</a>
    <h2 class="text-lg font-bold text-[var(--text)]">${role.name}</h2>
    ${role.is_default ? '<span class="text-xs px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-muted)]">Default Role</span>' : ''}
  </div>
  <form method="POST" action="/portal/roles/${role.id}/permissions" class="space-y-4">
    <input type="hidden" name="_csrf" value="${csrf}">
    ${Object.entries(groups).map(([group, ps]) => `
    <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 class="text-xs font-semibold text-[var(--text-muted)] uppercase mb-3">${group}</h3>
      <div class="grid grid-cols-2 gap-2">
        ${ps.map(p => `
        <label class="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
          <input type="checkbox" name="permissions" value="${p}" ${permSet.has(p) ? 'checked' : ''} ${role.is_default && role.name === 'Admin' ? 'disabled' : ''}
            class="rounded">
          ${p.replace(/_/g, ' ')}
        </label>`).join('')}
      </div>
    </div>`).join('')}
    ${!role.is_default || role.name !== 'Admin' ? `
    <button type="submit" class="h-9 px-6 rounded bg-[var(--accent)] text-white font-medium text-sm">Save Permissions</button>` : ''}
  </form>
</div></body></html>`);
});

roles.post(
  '/:id/permissions',
  requirePermission(PERMISSIONS.EDIT_ROLE),
  csrfMiddleware,
  async (c) => {
    const { orgId, sub: userId } = c.get('user');
    const roleId = c.req.param('id');
    const role = await getRoleById(c.env.DB, roleId, orgId);
    if (!role || (role.is_default && role.name === 'Admin')) {
      return c.json({ error: 'Cannot modify this role' }, 403);
    }
    const body = await c.req.parseBody({ all: true });
    const perms = Array.isArray(body['permissions']) ? body['permissions'] as string[] : body['permissions'] ? [body['permissions'] as string] : [];
    await setRolePermissions(c.env.DB, roleId, perms as any[]);
    await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'updated_role_permissions', module: 'roles', entityId: roleId });
    return c.redirect(`/portal/roles/${roleId}`);
  },
);

roles.post(
  '/:id/delete',
  requirePermission(PERMISSIONS.DELETE_ROLE),
  csrfMiddleware,
  async (c) => {
    const { orgId, sub: userId } = c.get('user');
    const roleId = c.req.param('id');
    await deleteRole(c.env.DB, roleId, orgId);
    await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'deleted_role', module: 'roles', entityId: roleId });
    return c.redirect('/portal/roles');
  },
);

export default roles;
