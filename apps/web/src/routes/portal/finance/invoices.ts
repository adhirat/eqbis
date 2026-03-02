import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requirePermission } from '../../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../../middleware/csrf.js';
import { ulid } from '../../../lib/id.js';
import { CreateInvoiceSchema, UpdateInvoiceStatusSchema } from '../../../lib/schemas.js';
import { getInvoices, getInvoiceById, getNextInvoiceNumber, createInvoice, updateInvoiceStatus, getInvoiceStats } from '../../../db/queries/finance.js';
import { getClients } from '../../../db/queries/crm.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const invoices = new Hono<HonoEnv>();

invoices.get('/', requirePermission(PERMISSIONS.VIEW_INVOICES), async (c) => {
  const { orgId } = c.get('user');
  const [rows, stats] = await Promise.all([getInvoices(c.env.DB, orgId), getInvoiceStats(c.env.DB, orgId)]);
  if (isApi(c)) return c.json({ invoices: rows, stats });

  const csrf = await generateCsrfToken(c);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Invoices — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-[var(--text)]">Invoices</h2>
    <a href="/portal/finance/invoices/new" class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium flex items-center">+ New Invoice</a>
  </div>

  <div class="grid grid-cols-3 gap-4">
    ${[['Paid', fmt(stats.total_paid), 'payments','text-green-400'],['Outstanding', fmt(stats.total_outstanding),'receipt','text-amber-400'],['Overdue', fmt(stats.total_overdue),'warning','text-red-400']].map(([l,v,icon,cls]) => `
    <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3">
      <span class="material-symbols-outlined ${cls}">${icon}</span>
      <div><p class="text-xs text-[var(--text-muted)]">${l}</p><p class="text-lg font-bold text-[var(--text)]">${v}</p></div>
    </div>`).join('')}
  </div>

  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]"><tr>
        ${['Invoice #','Client','Issue Date','Due Date','Total','Status','Actions'].map(h => `<th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">${h}</th>`).join('')}
      </tr></thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${rows.map(inv => `<tr>
          <td class="px-4 py-2.5 text-[var(--text)] font-mono text-xs">${inv.invoice_number}</td>
          <td class="px-4 py-2.5 text-[var(--text)]">${inv.client_name}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${inv.issue_date}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${inv.due_date ?? '—'}</td>
          <td class="px-4 py-2.5 text-[var(--text)] font-medium">${fmt(inv.total)}</td>
          <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-[11px] font-medium ${inv.status === 'paid' ? 'bg-green-500/15 text-green-400' : inv.status === 'overdue' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}">${inv.status}</span></td>
          <td class="px-4 py-2.5 flex gap-2">
            <a href="/portal/finance/invoices/${inv.id}" class="text-xs text-[var(--accent)] hover:underline">View</a>
            <a href="/portal/finance/invoices/${inv.id}/print" target="_blank" class="text-xs text-[var(--text-muted)] hover:underline">Print</a>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div></body></html>`);
});

invoices.get('/new', requirePermission(PERMISSIONS.CREATE_INVOICE), async (c) => {
  const { orgId } = c.get('user');
  const [clients, nextNum] = await Promise.all([getClients(c.env.DB, orgId), getNextInvoiceNumber(c.env.DB, orgId)]);
  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>New Invoice — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="p-6 max-w-2xl space-y-6">
  <div class="flex items-center gap-3">
    <a href="/portal/finance/invoices" class="text-[var(--text-muted)] hover:text-[var(--text)]">← Invoices</a>
    <h2 class="text-lg font-bold text-[var(--text)]">New Invoice</h2>
  </div>
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
    <form method="POST" action="/portal/finance/invoices" class="space-y-5" id="invoice-form">
      <input type="hidden" name="_csrf" value="${csrf}">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Invoice #</label>
        <input name="invoiceNumber" value="${nextNum}" readonly class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm opacity-60"></div>
        <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Client</label>
        <select name="clientId" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
          <option value="">Select or type below</option>
          ${clients.map(cl => `<option value="${cl.id}">${cl.name}</option>`).join('')}
        </select></div>
        <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Client Name</label>
        <input name="clientName" required class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>
        <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Due Date</label>
        <input name="dueDate" type="date" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-2">Line Items</label>
        <div id="items" class="space-y-2">
          <div class="grid grid-cols-12 gap-2 items-end">
            <div class="col-span-6"><input name="items[0][description]" placeholder="Description" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>
            <div class="col-span-2"><input name="items[0][quantity]" type="number" value="1" placeholder="Qty" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>
            <div class="col-span-3"><input name="items[0][unitPrice]" type="number" step="0.01" placeholder="Unit Price" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>
          </div>
        </div>
        <button type="button" onclick="addItem()" class="mt-2 text-xs text-[var(--accent)] hover:underline">+ Add Line Item</button>
      </div>
      <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Notes</label>
      <textarea name="notes" rows="2" class="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></textarea></div>
      <div class="flex gap-3"><a href="/portal/finance/invoices" class="h-9 px-4 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm flex items-center">Cancel</a>
      <button type="submit" class="h-9 px-6 rounded bg-[var(--accent)] text-white font-medium text-sm">Create Invoice</button></div>
    </form>
  </div>
</div>
<script>
let itemCount = 1;
function addItem() {
  const i = itemCount++;
  const div = document.createElement('div');
  div.className = 'grid grid-cols-12 gap-2 items-end';
  div.innerHTML = \`<div class="col-span-6"><input name="items[\${i}][description]" placeholder="Description" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div><div class="col-span-2"><input name="items[\${i}][quantity]" type="number" value="1" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div><div class="col-span-3"><input name="items[\${i}][unitPrice]" type="number" step="0.01" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div><div class="col-span-1"><button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-400 text-xs">✕</button></div>\`;
  document.getElementById('items').appendChild(div);
}
</script>
</body></html>`);
});

invoices.post('/', requirePermission(PERMISSIONS.CREATE_INVOICE), csrfMiddleware, async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const body = await c.req.parseBody({ all: true }) as Record<string, any>;

  // Parse flat items array from form
  const itemsMap: Record<number, { description: string; quantity: number; unitPrice: number }> = {};
  for (const [k, v] of Object.entries(body)) {
    const m = k.match(/^items\[(\d+)\]\[(\w+)\]$/);
    if (m) {
      const idx = parseInt(m[1]);
      if (!itemsMap[idx]) itemsMap[idx] = { description: '', quantity: 1, unitPrice: 0 };
      (itemsMap[idx] as any)[m[2]] = m[2] === 'description' ? String(v) : parseFloat(String(v));
    }
  }
  const items = Object.values(itemsMap)
    .filter(it => it.description)
    .map(it => ({ id: ulid(), description: it.description, quantity: it.quantity, unitPrice: it.unitPrice, total: it.quantity * it.unitPrice }));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const id = ulid();

  await createInvoice(c.env.DB, {
    id, orgId, clientId: body.clientId || undefined,
    invoiceNumber: body.invoiceNumber, clientName: body.clientName,
    clientEmail: body.clientEmail, dueDate: body.dueDate,
    subtotal, taxRate: 0, taxAmount: 0, total: subtotal,
    notes: body.notes, createdBy: userId, items,
  });

  await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'created_invoice', module: 'finance', entityId: id });
  return c.redirect('/portal/finance/invoices');
});

invoices.get('/:id', requirePermission(PERMISSIONS.VIEW_INVOICES), async (c) => {
  const { orgId } = c.get('user');
  const inv = await getInvoiceById(c.env.DB, c.req.param('id'), orgId);
  if (!inv) return c.json({ error: 'Not found' }, 404);
  if (isApi(c)) return c.json({ invoice: inv });

  const csrf = await generateCsrfToken(c);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>${inv.invoice_number} — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="p-6 max-w-2xl space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <a href="/portal/finance/invoices" class="text-[var(--text-muted)] hover:text-[var(--text)]">← Invoices</a>
      <h2 class="text-lg font-bold text-[var(--text)]">${inv.invoice_number}</h2>
    </div>
    <div class="flex gap-2">
      <a href="/portal/finance/invoices/${inv.id}/print" target="_blank" class="h-9 px-4 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm flex items-center">Print</a>
      ${inv.status !== 'paid' ? `<form method="POST" action="/portal/finance/invoices/${inv.id}/status"><input type="hidden" name="_csrf" value="${csrf}"><input type="hidden" name="status" value="paid"><button type="submit" class="h-9 px-4 rounded bg-green-500 text-white text-sm font-medium">Mark Paid</button></form>` : ''}
    </div>
  </div>
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
    <div class="flex justify-between"><div><p class="text-sm font-semibold text-[var(--text)]">${inv.client_name}</p>${inv.client_email ? `<p class="text-xs text-[var(--text-muted)]">${inv.client_email}</p>` : ''}</div>
    <div class="text-right"><p class="text-xs text-[var(--text-muted)]">Issue: ${inv.issue_date}</p>${inv.due_date ? `<p class="text-xs text-[var(--text-muted)]">Due: ${inv.due_date}</p>` : ''}</div></div>
    <table class="w-full text-sm"><thead class="border-b border-[var(--border)]"><tr>${['Description','Qty','Unit Price','Total'].map(h => `<th class="text-left py-2 text-xs font-semibold text-[var(--text-muted)]">${h}</th>`).join('')}</tr></thead>
    <tbody>${inv.items.map(it => `<tr class="border-b border-[var(--border)]/50"><td class="py-2 text-[var(--text)]">${it.description}</td><td class="py-2 text-[var(--text-muted)]">${it.quantity}</td><td class="py-2 text-[var(--text-muted)]">${fmt(it.unit_price)}</td><td class="py-2 text-[var(--text)] font-medium">${fmt(it.total)}</td></tr>`).join('')}</tbody></table>
    <div class="text-right"><p class="text-lg font-bold text-[var(--text)]">Total: ${fmt(inv.total)}</p></div>
  </div>
</div></body></html>`);
});

invoices.get('/:id/print', requirePermission(PERMISSIONS.VIEW_INVOICES), async (c) => {
  const { orgId } = c.get('user');
  const inv = await getInvoiceById(c.env.DB, c.req.param('id'), orgId);
  if (!inv) return c.text('Not found', 404);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  return c.html(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.invoice_number}</title><style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:auto}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #eee;padding:8px;text-align:left}@media print{.no-print{display:none}}</style></head>
<body><div class="no-print" style="margin-bottom:20px"><button onclick="window.print()">Print</button></div>
<h1 style="margin:0">${inv.invoice_number}</h1><p>${inv.client_name}</p>
<table><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
<tbody>${inv.items.map(it => `<tr><td>${it.description}</td><td>${it.quantity}</td><td>${fmt(it.unit_price)}</td><td>${fmt(it.total)}</td></tr>`).join('')}</tbody></table>
<p style="text-align:right;font-size:1.2em"><strong>Total: ${fmt(inv.total)}</strong></p></body></html>`);
});

invoices.post('/:id/status', requirePermission(PERMISSIONS.EDIT_INVOICE), csrfMiddleware, async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const body = await c.req.parseBody() as any;
  const status = body.status as string;
  await updateInvoiceStatus(c.env.DB, c.req.param('id'), orgId, status);
  await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: `updated_invoice_status`, module: 'finance', entityId: c.req.param('id'), details: { status } });
  return c.redirect(`/portal/finance/invoices/${c.req.param('id')}`);
});

export default invoices;
