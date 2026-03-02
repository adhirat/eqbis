/**
 * Support — Tickets  /portal/support/tickets
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { getTickets, getTicketById, createTicket, updateTicket, getTicketLogs, createTicketLog } from '../../../db/queries/tickets.js';
import { getOrgUsers } from '../../../db/queries/users.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const tickets = new Hono<HonoEnv>();

const PRIORITY_COLORS: Record<string, string> = {
  low:    'bg-blue-500/15 text-blue-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  high:   'bg-orange-500/15 text-orange-400',
  urgent: 'bg-red-500/15 text-red-400',
};
const STATUS_COLORS: Record<string, string> = {
  open:        'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-yellow-500/15 text-yellow-400',
  resolved:    'bg-green-500/15 text-green-400',
  closed:      'bg-slate-500/15 text-slate-400',
};

// ── List tickets ───────────────────────────────────────────────────────────────

tickets.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const status   = c.req.query('status');
    const priority = c.req.query('priority');

    const all = await getTickets(db, orgId, { status, priority });
    if (isApi(c)) return c.json({ tickets: all });

    const statusValues = ['open', 'in_progress', 'resolved', 'closed'];
    const filterLinks = statusValues.map(s =>
      `<a href="/portal/support/tickets?status=${s}"
         class="px-3 py-1.5 rounded text-sm ${status === s ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">${s.replace('_', ' ')}</a>`
    ).join('');

    const rows = all.map(t => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5">
          <a href="/portal/support/tickets/${t.id}" class="text-sm font-medium text-[var(--accent)] hover:underline">${t.subject}</a>
        </td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? ''}">${t.priority}</span></td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] ?? ''}">${t.status.replace('_', ' ')}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${t.user_name ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${t.assignee_name ?? 'Unassigned'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${new Date(t.updated_at * 1000).toLocaleDateString()}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>Support Tickets — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Support Tickets</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} tickets</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Ticket</button>
</div>
<div class="flex gap-2 mb-4 flex-wrap">
  <a href="/portal/support/tickets" class="px-3 py-1.5 rounded text-sm ${!status ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">All</a>
  ${filterLinks}
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Subject</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Priority</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Submitted By</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Assigned To</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Updated</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No tickets found</td></tr>'}</tbody>
  </table>
</div>

<!-- New Ticket Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Ticket</h2>
    <form method="POST" action="/portal/support/tickets">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Subject *</label>
          <input name="subject" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Priority</label>
          <select name="priority" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
          <textarea name="description" rows="4" class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create Ticket</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create ticket ──────────────────────────────────────────────────────────────

tickets.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd          = await c.req.formData();
    const subject     = fd.get('subject')     as string;
    const priority    = fd.get('priority')    as string || 'medium';
    const description = fd.get('description') as string || '';

    const id = ulid();
    await createTicket(db, { id, orgId, userId: user.sub, subject, priority });

    if (description) {
      const logId = ulid();
      await createTicketLog(db, { id: logId, orgId, ticketId: id, userId: user.sub, content: description, type: 'reply' });
    }

    await logActivity(db, orgId, user.sub, 'create', 'support', `Created ticket: ${subject}`);

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect(`/portal/support/tickets/${id}`);
  },
);

// ── Ticket detail ──────────────────────────────────────────────────────────────

tickets.get(
  '/:id',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const [ticket, logs, users] = await Promise.all([
      getTicketById(db, id, orgId),
      getTicketLogs(db, id, orgId),
      getOrgUsers(db, orgId),
    ]);

    if (!ticket) return c.notFound();
    if (isApi(c)) return c.json({ ticket, logs });

    const LOG_COLORS: Record<string, string> = {
      reply:          'border-[var(--border)]',
      internal_note:  'border-yellow-500 bg-yellow-500/5',
      status_change:  'border-blue-500 bg-blue-500/5',
    };

    const logItems = logs.map(l => `
      <div class="rounded-lg border p-3 ${LOG_COLORS[l.type] ?? 'border-[var(--border)]'}">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-medium">${l.user_name ?? 'System'}</span>
          <span class="text-xs text-[var(--text-muted)]">${new Date(l.created_at * 1000).toLocaleString()}</span>
          ${l.type !== 'reply' ? `<span class="text-xs px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-muted)]">${l.type.replace('_', ' ')}</span>` : ''}
        </div>
        <p class="text-sm whitespace-pre-wrap">${l.content}</p>
      </div>`).join('');

    const userOptions = users.map(u =>
      `<option value="${u.id}" ${ticket.assigned_to === u.id ? 'selected' : ''}>${u.full_name}</option>`
    ).join('');

    const canManage = user.permissions.includes(PERMISSIONS.MANAGE_TICKETS);

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>#${ticket.id.slice(-6)} — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<a href="/portal/support/tickets" class="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4 inline-block">← Back to Tickets</a>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- Thread -->
  <div class="lg:col-span-2 space-y-4">
    <div>
      <h1 class="text-xl font-semibold">${ticket.subject}</h1>
      <div class="flex items-center gap-2 mt-1">
        <span class="px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? ''}">${ticket.priority}</span>
        <span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status] ?? ''}">${ticket.status.replace('_', ' ')}</span>
      </div>
    </div>

    <div class="space-y-3">
      ${logItems || '<p class="text-sm text-[var(--text-muted)]">No messages yet</p>'}
    </div>

    <!-- Reply form -->
    <form method="POST" action="/portal/support/tickets/${ticket.id}/reply" x-data="{ noteMode: false }">
      <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div class="flex gap-3 mb-3 text-xs">
          <button type="button" @click="noteMode = false" :class="!noteMode ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'" class="font-medium">Reply</button>
          ${canManage ? `<button type="button" @click="noteMode = true" :class="noteMode ? 'text-yellow-400' : 'text-[var(--text-muted)]'" class="font-medium">Internal Note</button>` : ''}
        </div>
        <input type="hidden" name="type" :value="noteMode ? 'internal_note' : 'reply'">
        <textarea name="content" required rows="4" placeholder="Write your reply..."
          class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none mb-3"></textarea>
        <div class="flex justify-end">
          <button type="submit" class="h-8 px-4 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">
            <span x-text="noteMode ? 'Add Note' : 'Send Reply'">Send Reply</span>
          </button>
        </div>
      </div>
    </form>
  </div>

  <!-- Sidebar -->
  ${canManage ? `
  <div class="space-y-4">
    <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
      <h2 class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ticket Details</h2>
      <form method="POST" action="/portal/support/tickets/${ticket.id}/update" class="space-y-3">
        <div>
          <label class="block text-xs text-[var(--text-muted)] mb-1">Status</label>
          <select name="status" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded">
            ${['open','in_progress','resolved','closed'].map(s =>
              `<option value="${s}" ${ticket.status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs text-[var(--text-muted)] mb-1">Priority</label>
          <select name="priority" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded">
            ${['low','medium','high','urgent'].map(p =>
              `<option value="${p}" ${ticket.priority === p ? 'selected' : ''}>${p}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs text-[var(--text-muted)] mb-1">Assigned To</label>
          <select name="assignedTo" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded">
            <option value="">Unassigned</option>
            ${userOptions}
          </select>
        </div>
        <button type="submit" class="w-full h-8 bg-[var(--surface)] border border-[var(--border)] rounded text-sm hover:bg-[var(--bg)]">Update</button>
      </form>
    </div>
    <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 text-sm">
      <div class="flex justify-between"><span class="text-[var(--text-muted)]">Submitted by</span><span>${ticket.user_name ?? '—'}</span></div>
      <div class="flex justify-between"><span class="text-[var(--text-muted)]">Created</span><span>${new Date(ticket.created_at * 1000).toLocaleDateString()}</span></div>
      <div class="flex justify-between"><span class="text-[var(--text-muted)]">Updated</span><span>${new Date(ticket.updated_at * 1000).toLocaleDateString()}</span></div>
    </div>
  </div>` : ''}
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Reply to ticket ────────────────────────────────────────────────────────────

tickets.post(
  '/:id/reply',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const ticket = await getTicketById(db, id, orgId);
    if (!ticket) return c.notFound();

    const fd      = await c.req.formData();
    const content = fd.get('content') as string;
    const type    = fd.get('type')    as string || 'reply';

    const logId = ulid();
    await createTicketLog(db, { id: logId, orgId, ticketId: id, userId: user.sub, content, type });

    // Auto-move to in_progress if currently open
    if (ticket.status === 'open') {
      await updateTicket(db, id, orgId, { status: 'in_progress' });
    }

    if (isApi(c)) return c.json({ success: true });
    return c.redirect(`/portal/support/tickets/${id}`);
  },
);

// ── Update ticket fields ───────────────────────────────────────────────────────

tickets.post(
  '/:id/update',
  requireAnyPermission(PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const fd         = await c.req.formData();
    const status     = fd.get('status')     as string;
    const priority   = fd.get('priority')   as string;
    const assignedTo = fd.get('assignedTo') as string || null;

    await updateTicket(db, id, orgId, { status, priority, assigned_to: assignedTo });

    // Log status change
    const logId = ulid();
    await createTicketLog(db, { id: logId, orgId, ticketId: id, userId: user.sub,
      content: `Status changed to ${status}`, type: 'status_change' });

    await logActivity(db, orgId, user.sub, 'update', 'support', `Updated ticket status: ${status}`);

    if (isApi(c)) return c.json({ success: true });
    return c.redirect(`/portal/support/tickets/${id}`);
  },
);

export default tickets;
