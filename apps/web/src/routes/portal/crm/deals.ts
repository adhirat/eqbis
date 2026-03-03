/**
 * CRM — Deals  /portal/crm/deals
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const deals = new Hono<HonoEnv>();

const STAGE_COLORS: Record<string, string> = {
  prospecting:    'bg-slate-500/15 text-slate-400',
  qualification:  'bg-blue-500/15 text-blue-400',
  proposal:       'bg-violet-500/15 text-violet-400',
  negotiation:    'bg-orange-500/15 text-orange-400',
  closed_won:     'bg-green-500/15 text-green-400',
  closed_lost:    'bg-red-500/15 text-red-400',
};

// ── List deals ─────────────────────────────────────────────────────────────────

deals.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let all: any[] = [];
    try {
      const result = await db
        .prepare('SELECT * FROM deals WHERE org_id = ? ORDER BY created_at DESC')
        .bind(orgId)
        .all();
      all = result.results ?? [];
    } catch {
      all = [];
    }

    if (isApi(c)) return c.json({ deals: all });

    const totalValue = all.reduce((sum: number, d: any) => sum + (d.amount ?? 0), 0);

    const rows = all.map((d: any) => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium text-[var(--text)]">${d.name ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${d.account_name ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${d.amount != null ? '$' + Number(d.amount).toLocaleString() : '—'}</td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[d.stage] ?? ''}">${(d.stage ?? '—').replace('_', ' ')}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${d.close_date ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${d.created_at ? new Date(d.created_at * 1000).toLocaleDateString() : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deals — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Deals</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} deals · Pipeline value: <span class="text-[var(--text)] font-medium">$${totalValue.toLocaleString()}</span></p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Deal</button>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Deal Name</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Account</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Amount</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Stage</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Close Date</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Created</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No deals found</td></tr>'}</tbody>
  </table>
</div>

<!-- New Deal Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Deal</h2>
    <form method="POST" action="/portal/crm/deals">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Deal Name *</label>
          <input name="name" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Account</label>
          <input name="account_name" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Amount ($)</label>
            <input name="amount" type="number" min="0" step="0.01" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Stage</label>
            <select name="stage" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
              <option value="prospecting" selected>Prospecting</option>
              <option value="qualification">Qualification</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Expected Close Date</label>
          <input name="close_date" type="date" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create Deal</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create deal ────────────────────────────────────────────────────────────────

deals.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd           = await c.req.formData();
    const name         = fd.get('name')         as string;
    const account_name = fd.get('account_name') as string || null;
    const amount       = fd.get('amount')       ? parseFloat(fd.get('amount') as string) : null;
    const stage        = fd.get('stage')        as string || 'prospecting';
    const close_date   = fd.get('close_date')   as string || null;

    const id  = ulid();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db
        .prepare('INSERT INTO deals (id, org_id, name, account_name, amount, stage, close_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, orgId, name, account_name, amount, stage, close_date, now)
        .run();
    } catch {
      // table may not exist yet
    }

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/crm/deals');
  },
);

export default deals;
