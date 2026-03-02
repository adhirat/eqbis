/**
 * CRM — Forecasts  /portal/crm/forecasts
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const forecasts = new Hono<HonoEnv>();

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-slate-500/15 text-slate-400',
  submitted: 'bg-blue-500/15 text-blue-400',
  approved:  'bg-green-500/15 text-green-400',
  closed:    'bg-orange-500/15 text-orange-400',
};

// ── List forecasts ─────────────────────────────────────────────────────────────

forecasts.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let all: any[] = [];
    try {
      const result = await db
        .prepare('SELECT * FROM forecasts WHERE org_id = ? ORDER BY period DESC')
        .bind(orgId)
        .all();
      all = result.results ?? [];
    } catch {
      all = [];
    }

    if (isApi(c)) return c.json({ forecasts: all });

    const totalTarget = all.reduce((s: number, f: any) => s + (f.target ?? 0), 0);
    const totalActual = all.reduce((s: number, f: any) => s + (f.actual ?? 0), 0);

    const rows = all.map((f: any) => {
      const pct = f.target ? Math.round(((f.actual ?? 0) / f.target) * 100) : 0;
      const barColor = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500';
      return `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium text-[var(--text)]">${f.period ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${f.target != null ? '$' + Number(f.target).toLocaleString() : '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${f.actual != null ? '$' + Number(f.actual).toLocaleString() : '—'}</td>
        <td class="px-4 py-2.5">
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-[var(--border)] rounded-full h-1.5 w-24">
              <div class="${barColor} h-1.5 rounded-full" style="width:${Math.min(pct, 100)}%"></div>
            </div>
            <span class="text-xs text-[var(--text-muted)] w-8">${pct}%</span>
          </div>
        </td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[f.status] ?? ''}">${f.status ?? '—'}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${f.created_at ? new Date(f.created_at * 1000).toLocaleDateString() : '—'}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Forecasts — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">

<!-- Summary cards -->
<div class="grid grid-cols-3 gap-4 mb-6">
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
    <p class="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Total Target</p>
    <p class="text-2xl font-semibold">$${totalTarget.toLocaleString()}</p>
  </div>
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
    <p class="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Total Actual</p>
    <p class="text-2xl font-semibold">$${totalActual.toLocaleString()}</p>
  </div>
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
    <p class="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Attainment</p>
    <p class="text-2xl font-semibold">${totalTarget ? Math.round((totalActual / totalTarget) * 100) : 0}%</p>
  </div>
</div>

<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Forecasts</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} periods</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Forecast</button>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Period</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Target</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Actual</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Progress</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Created</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No forecasts found</td></tr>'}</tbody>
  </table>
</div>

<!-- New Forecast Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Forecast</h2>
    <form method="POST" action="/portal/crm/forecasts">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Period * (e.g. 2025-Q1, 2025-06)</label>
          <input name="period" required placeholder="2025-Q2" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Target ($)</label>
            <input name="target" type="number" min="0" step="0.01" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Actual ($)</label>
            <input name="actual" type="number" min="0" step="0.01" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Status</label>
          <select name="status" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
            <option value="draft" selected>Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create Forecast</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create forecast ────────────────────────────────────────────────────────────

forecasts.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd     = await c.req.formData();
    const period = fd.get('period') as string;
    const target = fd.get('target') ? parseFloat(fd.get('target') as string) : null;
    const actual = fd.get('actual') ? parseFloat(fd.get('actual') as string) : null;
    const status = fd.get('status') as string || 'draft';

    const id  = ulid();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db
        .prepare('INSERT INTO forecasts (id, org_id, period, target, actual, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, orgId, period, target, actual, status, now)
        .run();
    } catch {
      // table may not exist yet
    }

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/crm/forecasts');
  },
);

export default forecasts;
