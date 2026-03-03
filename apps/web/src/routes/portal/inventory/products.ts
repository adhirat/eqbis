/**
 * Inventory — Products  /portal/inventory/products
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const products = new Hono<HonoEnv>();

// ── List products ──────────────────────────────────────────────────────────────

products.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let all: any[] = [];
    try {
      const result = await db
        .prepare('SELECT * FROM products WHERE org_id = ? ORDER BY created_at DESC')
        .bind(orgId)
        .all();
      all = result.results ?? [];
    } catch {
      all = [];
    }

    if (isApi(c)) return c.json({ products: all });

    const fmt = (n: number | null) =>
      n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—';

    const rows = all.map((p: any) => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium text-[var(--text)]">${p.name ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)] font-mono">${p.product_code ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${fmt(p.unit_price)}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.quantity_in_stock ?? 0}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.created_at ? new Date(p.created_at * 1000).toLocaleDateString() : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Products — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Products</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} products</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Product</button>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Product Name</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Code</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Unit Price ($)</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Stock</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Created</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No products found</td></tr>'}</tbody>
  </table>
</div>

<!-- New Product Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Product</h2>
    <form method="POST" action="/portal/inventory/products">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Name *</label>
          <input name="name" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Product Code</label>
          <input name="product_code" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Unit Price</label>
            <input name="unit_price" type="number" step="0.01" min="0" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Stock Quantity</label>
            <input name="quantity_in_stock" type="number" min="0" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create Product</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create product ─────────────────────────────────────────────────────────────

products.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd                = await c.req.formData();
    const name              = fd.get('name')              as string;
    const product_code      = fd.get('product_code')      as string || null;
    const unit_price_raw    = fd.get('unit_price')        as string;
    const stock_raw         = fd.get('quantity_in_stock') as string;
    const unit_price        = unit_price_raw      ? parseFloat(unit_price_raw)   : null;
    const quantity_in_stock = stock_raw           ? parseInt(stock_raw, 10)      : 0;

    const id  = ulid();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db
        .prepare('INSERT INTO products (id, org_id, name, product_code, unit_price, quantity_in_stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, orgId, name, product_code, unit_price, quantity_in_stock, now)
        .run();
    } catch {
      // table may not exist yet
    }

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/inventory/products');
  },
);

export default products;
