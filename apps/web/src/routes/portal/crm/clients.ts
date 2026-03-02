/**
 * CRM — Clients  /portal/crm/clients
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { getClients, getClientById, createClient, updateClient, getProjects } from '../../../db/queries/crm.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const clients = new Hono<HonoEnv>();

// ── List clients ───────────────────────────────────────────────────────────────

clients.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const status = c.req.query('status');

    const all = await getClients(db, orgId, status);

    if (isApi(c)) return c.json({ clients: all });

    const statusFilter = ['active', 'inactive', 'lead'];
    const filterLinks = statusFilter.map(s =>
      `<a href="/portal/crm/clients?status=${s}"
         class="px-3 py-1.5 rounded text-sm ${status === s ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">${s.charAt(0).toUpperCase()+s.slice(1)}</a>`
    ).join('');

    const statusBadge = (s: string) => {
      const map: Record<string, string> = { active: 'bg-green-500/15 text-green-400', inactive: 'bg-red-500/15 text-red-400', lead: 'bg-yellow-500/15 text-yellow-400' };
      return `<span class="px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? ''}">${s}</span>`;
    };

    const rows = all.map(cl => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5">
          <a href="/portal/crm/clients/${cl.id}" class="text-sm font-medium text-[var(--accent)] hover:underline">${cl.name}</a>
        </td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${cl.email ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${cl.company ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${cl.phone ?? '—'}</td>
        <td class="px-4 py-2.5">${statusBadge(cl.status)}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${new Date(cl.created_at * 1000).toLocaleDateString()}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clients — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Clients</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} total clients</p>
  </div>
  <button @click="addOpen = true"
    class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ Add Client</button>
</div>
<div class="flex gap-2 mb-4 flex-wrap">
  <a href="/portal/crm/clients" class="px-3 py-1.5 rounded text-sm ${!status ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">All</a>
  ${filterLinks}
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Name</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Email</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Company</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Phone</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Added</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="px-4 py-8 text-center text-[var(--text-muted)] text-sm">No clients yet</td></tr>'}</tbody>
  </table>
</div>

<!-- Add Client Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">Add Client</h2>
    <form method="POST" action="/portal/crm/clients">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Name *</label>
            <input name="name" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Status</label>
            <select name="status" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Email</label>
            <input name="email" type="email" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Phone</label>
            <input name="phone" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Company</label>
          <input name="company" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Address</label>
          <textarea name="address" rows="2" class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Notes</label>
          <textarea name="notes" rows="2" class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm hover:bg-[var(--bg)]">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Add Client</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create client ──────────────────────────────────────────────────────────────

clients.post(
  '/',
  requireAnyPermission(PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd = await c.req.formData().catch(() => null);
    let name: string, email: string | undefined, phone: string | undefined,
        company: string | undefined, address: string | undefined,
        notes: string | undefined, status: string;

    if (fd) {
      name    = fd.get('name')    as string;
      email   = fd.get('email')   as string || undefined;
      phone   = fd.get('phone')   as string || undefined;
      company = fd.get('company') as string || undefined;
      address = fd.get('address') as string || undefined;
      notes   = fd.get('notes')   as string || undefined;
      status  = fd.get('status')  as string || 'active';
    } else {
      const body = await c.req.json();
      ({ name, email, phone, company, address, notes, status = 'active' } = body);
    }

    const id = ulid();
    await createClient(db, { id, orgId, name, email, phone, company, address, notes, status });
    await logActivity(db, orgId, user.sub, 'create', 'crm', `Added client: ${name}`);

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/crm/clients');
  },
);

// ── View client ────────────────────────────────────────────────────────────────

clients.get(
  '/:id',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const client = await getClientById(db, id, orgId);
    if (!client) return c.notFound();

    const projects = await getProjects(db, orgId, { clientId: id });

    if (isApi(c)) return c.json({ client, projects });

    const statusColors: Record<string, string> = {
      active: 'bg-green-500/15 text-green-400',
      inactive: 'bg-red-500/15 text-red-400',
      lead: 'bg-yellow-500/15 text-yellow-400',
    };

    const projectRows = projects.map(p => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)]">
        <td class="px-4 py-2.5">
          <a href="/portal/projects/${p.id}" class="text-sm font-medium text-[var(--accent)] hover:underline">${p.name}</a>
        </td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.status}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.start_date ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.end_date ?? '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>${client.name} — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<a href="/portal/crm/clients" class="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4 inline-block">← Back to Clients</a>
<div class="flex items-start justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">${client.name}</h1>
    <span class="px-2 py-0.5 rounded text-xs font-medium mt-1 inline-block ${statusColors[client.status] ?? ''}">${client.status}</span>
  </div>
  <form method="POST" action="/portal/crm/clients/${client.id}/status">
    <select name="status" onchange="this.form.submit()"
      class="h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none">
      <option value="active" ${client.status === 'active' ? 'selected' : ''}>Active</option>
      <option value="lead" ${client.status === 'lead' ? 'selected' : ''}>Lead</option>
      <option value="inactive" ${client.status === 'inactive' ? 'selected' : ''}>Inactive</option>
    </select>
  </form>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
    <h2 class="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Contact Info</h2>
    ${client.email ? `<div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">Email</span><a href="mailto:${client.email}" class="text-[var(--accent)] hover:underline">${client.email}</a></div>` : ''}
    ${client.phone ? `<div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">Phone</span><span>${client.phone}</span></div>` : ''}
    ${client.company ? `<div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">Company</span><span>${client.company}</span></div>` : ''}
    ${client.address ? `<div class="text-sm"><span class="text-[var(--text-muted)]">Address</span><p class="mt-1">${client.address}</p></div>` : ''}
  </div>
  ${client.notes ? `
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
    <h2 class="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Notes</h2>
    <p class="text-sm">${client.notes}</p>
  </div>` : ''}
</div>

<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <div class="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
    <h2 class="text-sm font-semibold">Projects (${projects.length})</h2>
  </div>
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Project</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Start</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">End</th>
    </tr></thead>
    <tbody>${projectRows || '<tr><td colspan="4" class="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No projects yet</td></tr>'}</tbody>
  </table>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Update client status ───────────────────────────────────────────────────────

clients.post(
  '/:id/status',
  requireAnyPermission(PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const fd     = await c.req.formData();
    const status = fd.get('status') as string;

    await updateClient(db, id, orgId, { status });
    await logActivity(db, orgId, user.sub, 'update', 'crm', `Updated client status: ${status}`);

    if (isApi(c)) return c.json({ success: true });
    return c.redirect(`/portal/crm/clients/${id}`);
  },
);

export default clients;
