/**
 * Finance module DB queries — invoices (with line items), receipts.
 */

// ── Invoices ──────────────────────────────────────────────────────────────────

export interface InvoiceRow {
  id:             string;
  org_id:         string;
  client_id:      string | null;
  invoice_number: string;
  client_name:    string;
  client_email:   string | null;
  issue_date:     string;
  due_date:       string | null;
  status:         string;
  subtotal:       number;
  tax_rate:       number;
  tax_amount:     number;
  total:          number;
  notes:          string | null;
  created_at:     number;
}

export interface InvoiceItemRow {
  id:          string;
  invoice_id:  string;
  description: string;
  quantity:    number;
  unit_price:  number;
  total:       number;
}

export async function getInvoices(
  db: D1Database,
  orgId: string,
  status?: string,
): Promise<InvoiceRow[]> {
  const sql = status
    ? 'SELECT * FROM invoices WHERE org_id = ? AND status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM invoices WHERE org_id = ? ORDER BY created_at DESC';
  const stmt = status ? db.prepare(sql).bind(orgId, status) : db.prepare(sql).bind(orgId);
  return (await stmt.all<InvoiceRow>()).results;
}

export async function getInvoiceById(
  db: D1Database, id: string, orgId: string,
): Promise<(InvoiceRow & { items: InvoiceItemRow[] }) | null> {
  const invoice = await db
    .prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ? LIMIT 1')
    .bind(id, orgId)
    .first<InvoiceRow>();

  if (!invoice) return null;

  const items = await db
    .prepare('SELECT * FROM invoice_items WHERE invoice_id = ?')
    .bind(id)
    .all<InvoiceItemRow>();

  return { ...invoice, items: items.results };
}

export async function getNextInvoiceNumber(db: D1Database, orgId: string): Promise<string> {
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM invoices WHERE org_id = ? AND invoice_number LIKE ?`,
    )
    .bind(orgId, `INV-${yearMonth}-%`)
    .first<{ cnt: number }>();
  const seq = String((row?.cnt ?? 0) + 1).padStart(4, '0');
  return `INV-${yearMonth}-${seq}`;
}

export async function createInvoice(
  db: D1Database,
  inv: {
    id: string; orgId: string; clientId?: string; invoiceNumber: string;
    clientName: string; clientEmail?: string; dueDate?: string;
    subtotal: number; taxRate: number; taxAmount: number; total: number;
    notes?: string; createdBy?: string;
    items: Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO invoices
        (id, org_id, client_id, invoice_number, client_name, client_email, due_date,
         subtotal, tax_rate, tax_amount, total, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      inv.id, inv.orgId, inv.clientId ?? null, inv.invoiceNumber,
      inv.clientName, inv.clientEmail ?? null, inv.dueDate ?? null,
      inv.subtotal, inv.taxRate, inv.taxAmount, inv.total,
      inv.notes ?? null, inv.createdBy ?? null,
    )
    .run();

  for (const item of inv.items) {
    await db
      .prepare(
        'INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(item.id, inv.id, item.description, item.quantity, item.unitPrice, item.total)
      .run();
  }
}

export async function updateInvoiceStatus(
  db: D1Database, id: string, orgId: string, status: string,
): Promise<void> {
  await db
    .prepare('UPDATE invoices SET status = ?, updated_at = unixepoch() WHERE id = ? AND org_id = ?')
    .bind(status, id, orgId)
    .run();
}

// ── Invoice summary stats ─────────────────────────────────────────────────────

export async function getInvoiceStats(
  db: D1Database, orgId: string,
): Promise<{ total_paid: number; total_outstanding: number; total_overdue: number }> {
  const row = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'paid'    THEN total ELSE 0 END) AS total_paid,
         SUM(CASE WHEN status = 'sent'    THEN total ELSE 0 END) AS total_outstanding,
         SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) AS total_overdue
       FROM invoices WHERE org_id = ?`,
    )
    .bind(orgId)
    .first<{ total_paid: number; total_outstanding: number; total_overdue: number }>();
  return row ?? { total_paid: 0, total_outstanding: 0, total_overdue: 0 };
}

// ── Receipts ──────────────────────────────────────────────────────────────────

export interface ReceiptRow {
  id:         string;
  org_id:     string;
  user_id:    string | null;
  title:      string;
  amount:     number;
  type:       string;
  category:   string | null;
  period:     string | null;
  file_key:   string | null;
  notes:      string | null;
  created_at: number;
}

export async function getReceipts(
  db: D1Database, orgId: string, type?: string,
): Promise<ReceiptRow[]> {
  const sql = type
    ? 'SELECT * FROM receipts WHERE org_id = ? AND type = ? ORDER BY created_at DESC'
    : 'SELECT * FROM receipts WHERE org_id = ? ORDER BY created_at DESC';
  const stmt = type ? db.prepare(sql).bind(orgId, type) : db.prepare(sql).bind(orgId);
  return (await stmt.all<ReceiptRow>()).results;
}

export async function createReceipt(
  db: D1Database,
  r: { id: string; orgId: string; userId?: string; title: string; amount: number; type: string; category?: string; period?: string; fileKey?: string; notes?: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO receipts (id, org_id, user_id, title, amount, type, category, period, file_key, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(r.id, r.orgId, r.userId ?? null, r.title, r.amount, r.type, r.category ?? null, r.period ?? null, r.fileKey ?? null, r.notes ?? null)
    .run();
}
