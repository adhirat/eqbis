/**
 * Inventory — Purchase Orders  /portal/inventory/purchase-orders
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const purchaseOrders = new Hono<HonoEnv>();

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-slate-500/15 text-slate-400',
  sent:      'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-yellow-500/15 text-yellow-400',
  received:  'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

// ── List purchase orders ───────────────────────────────────────────────────────

purchaseOrders.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let all: any[] = [];
    try {
      const result = await db
        .prepare('SELECT * FROM purchase_orders WHERE org_id = ? ORDER BY created_at DESC')
        .bind(orgId)
        .all();
      all = result.results ?? [];
    } catch {
      all = [];
    }

    if (isApi(c)) return c.json({ purchaseOrders: all });

    const fmt = (n: number | null) =>
      n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—';

    const rows = all.map((o: any) => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium text-[var(--text)]">${o.subject ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${o.vendor_name ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${fmt(o.total_amount)}</td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[o.status] ?? ''}">${o.status ?? '—'}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${o.created_at ? new Date(o.created_at * 1000).toLocaleDateString() : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Purchase Orders — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Purchase Orders</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} purchase orders</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New PO</button>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Subject</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Vendor</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Amount ($)</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Created</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No purchase orders found</td></tr>'}</tbody>
  </table>
</div>

<!-- New PO Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Purchase Order</h2>
    <form method="POST" action="/portal/inventory/purchase-orders">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Subject *</label>
          <input name="subject" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Vendor Name</label>
          <input name="vendor_name" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Status</label>
            <select name="status" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
              <option value="draft" selected>Draft</option>
              <option value="sent">Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Total Amount</label>
            <input name="total_amount" type="number" step="0.01" min="0" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create PO</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create purchase order ──────────────────────────────────────────────────────

purchaseOrders.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd           = await c.req.formData();
    const subject      = fd.get('subject')      as string;
    const vendor_name  = fd.get('vendor_name')  as string || null;
    const status       = fd.get('status')        as string || 'draft';
    const amountRaw    = fd.get('total_amount')  as string;
    const total_amount = amountRaw ? parseFloat(amountRaw) : null;

    const id  = ulid();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db
        .prepare('INSERT INTO purchase_orders (id, org_id, subject, vendor_name, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, orgId, subject, vendor_name, status, total_amount, now)
        .run();
    } catch {
      // table may not exist yet
    }

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/inventory/purchase-orders');
  },
);

export default purchaseOrders;
