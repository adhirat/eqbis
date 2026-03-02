/**
 * Communications module — /portal/comms
 * Messages (contact form submissions) + Newsletter subscribers
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { getMessages, updateMessageStatus, getNewsletterSubs, updateNewsletterStatus } from '../../../db/queries/tickets.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const comms = new Hono<HonoEnv>();

// ── Messages (contact form submissions) ───────────────────────────────────────

comms.get(
  '/messages',
  requireAnyPermission(PERMISSIONS.VIEW_COMMS, PERMISSIONS.MANAGE_COMMS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const status = c.req.query('status');

    const all = await getMessages(db, orgId, status);
    if (isApi(c)) return c.json({ messages: all });

    const STATUS_COLORS: Record<string, string> = {
      new:       'bg-blue-500/15 text-blue-400',
      read:      'bg-slate-500/15 text-slate-400',
      responded: 'bg-green-500/15 text-green-400',
      archived:  'bg-slate-500/10 text-slate-500',
    };

    const statusLinks = ['new', 'read', 'responded', 'archived'].map(s =>
      `<a href="/portal/comms/messages?status=${s}"
         class="px-3 py-1.5 rounded text-sm ${status === s ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">${s.charAt(0).toUpperCase() + s.slice(1)}</a>`
    ).join('');

    const rows = all.map(m => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors" x-data="{ open: false }">
        <td class="px-4 py-2.5">
          <button @click="open = !open" class="text-sm font-medium text-left hover:text-[var(--accent)]">${m.name}</button>
        </td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]"><a href="mailto:${m.email}" class="hover:underline">${m.email}</a></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)] max-w-xs truncate">${m.message.slice(0, 60)}…</td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[m.status] ?? ''}">${m.status}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${m.source}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${new Date(m.created_at * 1000).toLocaleDateString()}</td>
        <td class="px-4 py-2.5">
          <form method="POST" action="/portal/comms/messages/${m.id}/status" class="flex gap-1">
            <select name="status" class="h-7 px-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded">
              <option value="new" ${m.status === 'new' ? 'selected' : ''}>New</option>
              <option value="read" ${m.status === 'read' ? 'selected' : ''}>Read</option>
              <option value="responded" ${m.status === 'responded' ? 'selected' : ''}>Responded</option>
              <option value="archived" ${m.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
            <button type="submit" class="h-7 px-2 text-xs bg-[var(--accent)] text-white rounded hover:opacity-90">Update</button>
          </form>
        </td>
      </tr>
      <tr x-show="open" x-cloak class="bg-[var(--surface)]">
        <td colspan="7" class="px-4 pb-4">
          <p class="text-sm mt-2">${m.message}</p>
          ${m.response ? `<div class="mt-3 p-3 rounded border border-green-500/20 bg-green-500/5 text-sm"><span class="font-medium text-green-400">Response:</span> ${m.response}</div>` : ''}
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>Messages — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Messages</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">Contact form submissions</p>
  </div>
  <a href="/portal/comms/newsletter" class="text-sm text-[var(--accent)] hover:underline">Newsletter Subscribers →</a>
</div>
<div class="flex gap-2 mb-4 flex-wrap">
  <a href="/portal/comms/messages" class="px-3 py-1.5 rounded text-sm ${!status ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">All</a>
  ${statusLinks}
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Name</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Email</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Message</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Source</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Received</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Action</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No messages yet</td></tr>'}</tbody>
  </table>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Update message status ──────────────────────────────────────────────────────

comms.post(
  '/messages/:id/status',
  requireAnyPermission(PERMISSIONS.MANAGE_COMMS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const fd       = await c.req.formData();
    const status   = fd.get('status')   as string;
    const response = fd.get('response') as string || undefined;

    await updateMessageStatus(db, id, orgId, status, user.sub, response);
    await logActivity(db, orgId, user.sub, 'update', 'comms', `Updated message status: ${status}`);

    if (isApi(c)) return c.json({ success: true });
    return c.redirect('/portal/comms/messages');
  },
);

// ── Newsletter subscribers ─────────────────────────────────────────────────────

comms.get(
  '/newsletter',
  requireAnyPermission(PERMISSIONS.VIEW_COMMS, PERMISSIONS.MANAGE_COMMS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const subs = await getNewsletterSubs(db, orgId);
    if (isApi(c)) return c.json({ subscribers: subs });

    const STATUS_COLORS: Record<string, string> = {
      active:       'bg-green-500/15 text-green-400',
      unsubscribed: 'bg-red-500/15 text-red-400',
      bounced:      'bg-orange-500/15 text-orange-400',
    };

    const activeCount       = subs.filter(s => s.status === 'active').length;
    const unsubscribedCount = subs.filter(s => s.status === 'unsubscribed').length;

    const rows = subs.map(s => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)]">
        <td class="px-4 py-2.5 text-sm">${s.email}</td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s.status] ?? ''}">${s.status}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${s.source}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${new Date(s.created_at * 1000).toLocaleDateString()}</td>
        <td class="px-4 py-2.5">
          <form method="POST" action="/portal/comms/newsletter/${s.id}/status">
            <button name="status" value="${s.status === 'active' ? 'unsubscribed' : 'active'}"
              class="text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:underline">
              ${s.status === 'active' ? 'Unsubscribe' : 'Reactivate'}
            </button>
          </form>
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>Newsletter — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Newsletter Subscribers</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${activeCount} active · ${unsubscribedCount} unsubscribed</p>
  </div>
  <a href="/portal/comms/messages" class="text-sm text-[var(--accent)] hover:underline">← Messages</a>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Email</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Source</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Subscribed</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase"></th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No subscribers yet</td></tr>'}</tbody>
  </table>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Update newsletter status ───────────────────────────────────────────────────

comms.post(
  '/newsletter/:id/status',
  requireAnyPermission(PERMISSIONS.MANAGE_COMMS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const fd     = await c.req.formData();
    const status = fd.get('status') as string;

    await updateNewsletterStatus(db, id, orgId, status);
    await logActivity(db, orgId, user.sub, 'update', 'comms', `Updated newsletter subscriber status: ${status}`);

    if (isApi(c)) return c.json({ success: true });
    return c.redirect('/portal/comms/newsletter');
  },
);

// Redirect /portal/comms → messages
comms.get('/', (c) => c.redirect('/portal/comms/messages'));

export default comms;
