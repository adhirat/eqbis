/**
 * Finance — Receipts / Expenses  /portal/finance/receipts
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { getReceipts, createReceipt } from '../../../db/queries/finance.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';
import { presignPut } from '../../../lib/storage.js';
import { CreateReceiptSchema } from '../../../lib/schemas.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const receipts = new Hono<HonoEnv>();

// ── List receipts ──────────────────────────────────────────────────────────────

receipts.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const type = c.req.query('type');  // 'income' | 'expense' | undefined
    const all  = await getReceipts(db, orgId, type);

    const totalIncome  = all.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const totalExpense = all.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const net          = totalIncome - totalExpense;

    if (isApi(c)) return c.json({ receipts: all, totalIncome, totalExpense, net });

    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    const filterBar = `
      <div class="flex gap-2 mb-4 flex-wrap">
        <a href="/portal/finance/receipts"
           class="px-3 py-1.5 rounded text-sm ${!type ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">All</a>
        <a href="/portal/finance/receipts?type=income"
           class="px-3 py-1.5 rounded text-sm ${type === 'income' ? 'bg-green-600 text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">Income</a>
        <a href="/portal/finance/receipts?type=expense"
           class="px-3 py-1.5 rounded text-sm ${type === 'expense' ? 'bg-red-600 text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">Expense</a>
      </div>`;

    const rows = all.map(r => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium">${r.title}</td>
        <td class="px-4 py-2.5 text-sm">
          <span class="px-2 py-0.5 rounded text-xs font-medium ${r.type === 'income' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}">
            ${r.type}
          </span>
        </td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${r.category ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${r.period ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm font-medium ${r.type === 'income' ? 'text-green-400' : 'text-red-400'}">${fmt(r.amount)}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">
          ${new Date(r.created_at * 1000).toLocaleDateString()}
        </td>
        ${r.file_key ? `
        <td class="px-4 py-2.5">
          <a href="${c.env.R2_PUBLIC}/${r.file_key}" target="_blank"
             class="text-[var(--accent)] hover:underline text-xs">View</a>
        </td>` : '<td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">—</td>'}
      </tr>`).join('');

    const html = `
      <!DOCTYPE html><html lang="en" data-theme="dark">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Receipts & Expenses — EQBIS</title>
      <link rel="stylesheet" href="/css/app.css">
      <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
      </head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen">
      <div x-data="{ addOpen: false, uploading: false }">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold">Receipts & Expenses</h1>
          <p class="text-sm text-[var(--text-muted)] mt-0.5">Track income and expense records</p>
        </div>
        <button @click="addOpen = true"
          class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90 transition-opacity">
          + Add Record
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p class="text-xs text-[var(--text-muted)] uppercase tracking-wide">Total Income</p>
          <p class="text-2xl font-bold text-green-400 mt-1">${fmt(totalIncome)}</p>
        </div>
        <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p class="text-xs text-[var(--text-muted)] uppercase tracking-wide">Total Expenses</p>
          <p class="text-2xl font-bold text-red-400 mt-1">${fmt(totalExpense)}</p>
        </div>
        <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p class="text-xs text-[var(--text-muted)] uppercase tracking-wide">Net</p>
          <p class="text-2xl font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'} mt-1">${fmt(net)}</p>
        </div>
      </div>

      <!-- Filter + Table -->
      ${filterBar}
      <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-[var(--border)] text-left">
              <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Title</th>
              <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Type</th>
              <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Category</th>
              <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Period</th>
              <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Amount</th>
              <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Date</th>
              <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">File</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7" class="px-4 py-8 text-center text-[var(--text-muted)] text-sm">No records found</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Add Record Modal -->
      <div x-show="addOpen" x-cloak
           class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
           @keydown.escape.window="addOpen = false">
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6"
             @click.outside="addOpen = false">
          <h2 class="text-lg font-semibold mb-4">Add Record</h2>
          <form method="POST" action="/portal/finance/receipts" enctype="multipart/form-data"
                @submit="uploading = true">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Title</label>
                <input name="title" required
                  class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
                  <select name="type"
                    class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Amount</label>
                  <input name="amount" type="number" step="0.01" min="0" required
                    class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
                  <input name="category" placeholder="e.g. Travel, Office"
                    class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Period (YYYY-MM)</label>
                  <input name="period" placeholder="${new Date().toISOString().slice(0,7)}"
                    class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Notes</label>
                <textarea name="notes" rows="2"
                  class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
              </div>
              <div>
                <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Receipt file (optional)</label>
                <input name="file" type="file" accept="image/*,.pdf"
                  class="w-full text-sm text-[var(--text-muted)] file:mr-3 file:h-7 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[var(--accent)] file:text-white cursor-pointer">
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button type="button" @click="addOpen = false"
                class="flex-1 h-8 border border-[var(--border)] rounded text-sm hover:bg-[var(--bg)] transition-colors">Cancel</button>
              <button type="submit"
                class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
                :disabled="uploading" x-text="uploading ? 'Saving...' : 'Save Record'"></button>
            </div>
          </form>
        </div>
      </div>

      </div><!-- x-data -->
      </body></html>`;

    return c.html(html);
  },
);

// ── Presign for direct-to-R2 upload ───────────────────────────────────────────

receipts.post(
  '/presign',
  requireAnyPermission(PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const body = await c.req.json();
    const { filename, contentType } = body as { filename: string; contentType: string };
    const user  = c.get('user');
    const key   = `receipts/${user.orgId}/${ulid()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const url   = await presignPut({ bucket: c.env.R2, key, contentType, expiresIn: 900 });
    return c.json({ url, key });
  },
);

// ── Create receipt (POST /) ────────────────────────────────────────────────────

receipts.post(
  '/',
  requireAnyPermission(PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let fileKey: string | undefined;

    // Handle multipart: file may be present
    const ct = c.req.header('content-type') ?? '';
    if (ct.includes('multipart/form-data')) {
      const fd = await c.req.formData();

      const title    = fd.get('title')    as string;
      const type     = fd.get('type')     as string || 'expense';
      const amount   = parseFloat(fd.get('amount') as string);
      const category = fd.get('category') as string || undefined;
      const period   = fd.get('period')   as string || undefined;
      const notes    = fd.get('notes')    as string || undefined;
      const file     = fd.get('file')     as File | null;

      if (file && file.size > 0) {
        const key = `receipts/${orgId}/${ulid()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const buf = await file.arrayBuffer();
        await c.env.R2.put(key, buf, { httpMetadata: { contentType: file.type } });
        fileKey = key;
      }

      const id = ulid();
      await createReceipt(db, { id, orgId, userId: user.sub, title, amount, type, category, period, notes, fileKey });

      await logActivity(db, { orgId, userId: user.sub, action: 'create', module: 'finance',
        details: `Created ${type} record: ${title} (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)})` });

      if (isApi(c)) return c.json({ success: true, id });
      return c.redirect('/portal/finance/receipts');
    }

    // JSON body (API clients)
    const body = await c.req.json();
    const parsed = CreateReceiptSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const { title, type = 'expense', amount, category, period, notes } = parsed.data;
    const id = ulid();
    await createReceipt(db, { id, orgId, userId: user.sub, title, amount, type, category, period, notes });

    await logActivity(db, { orgId, userId: user.sub, action: 'create', module: 'finance', details: `Created ${type} record: ${title}` });
    return c.json({ success: true, id });
  },
);

export default receipts;
