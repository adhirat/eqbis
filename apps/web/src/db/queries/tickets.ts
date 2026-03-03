/**
 * Support & Communications DB queries — tickets, ticket logs, messages, newsletter.
 */

// ── Tickets ───────────────────────────────────────────────────────────────────

export interface TicketRow {
  id:          string;
  org_id:      string;
  user_id:     string | null;
  subject:     string;
  priority:    string;
  status:      string;
  assigned_to: string | null;
  created_at:  number;
  updated_at:  number;
  // joined
  user_name?:      string;
  assignee_name?:  string;
}

export async function getTickets(
  db: D1Database,
  orgId: string,
  opts: { status?: string; priority?: string; assignedTo?: string } = {},
): Promise<TicketRow[]> {
  const conditions = ['t.org_id = ?'];
  const vals: unknown[] = [orgId];

  if (opts.status)     { conditions.push('t.status = ?');      vals.push(opts.status); }
  if (opts.priority)   { conditions.push('t.priority = ?');    vals.push(opts.priority); }
  if (opts.assignedTo) { conditions.push('t.assigned_to = ?'); vals.push(opts.assignedTo); }

  return (await db
    .prepare(
      `SELECT t.*,
              u.full_name AS user_name,
              a.full_name AS assignee_name
       FROM tickets t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN users a ON a.id = t.assigned_to
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.updated_at DESC`,
    )
    .bind(...vals)
    .all<TicketRow>()).results;
}

export async function getTicketById(
  db: D1Database, id: string, orgId: string,
): Promise<TicketRow | null> {
  return db
    .prepare(
      `SELECT t.*, u.full_name AS user_name, a.full_name AS assignee_name
       FROM tickets t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN users a ON a.id = t.assigned_to
       WHERE t.id = ? AND t.org_id = ? LIMIT 1`,
    )
    .bind(id, orgId)
    .first<TicketRow>();
}

export async function createTicket(
  db: D1Database,
  t: { id: string; orgId: string; userId?: string; subject: string; priority: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO tickets (id, org_id, user_id, subject, priority) VALUES (?, ?, ?, ?, ?)')
    .bind(t.id, t.orgId, t.userId ?? null, t.subject, t.priority)
    .run();
}

export async function updateTicket(
  db: D1Database, id: string, orgId: string,
  fields: Partial<{ status: string; priority: string; assigned_to: string | null }>,
): Promise<void> {
  const sets: string[] = []; const vals: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = ?`); vals.push(v);
  }
  if (!sets.length) return;
  sets.push('updated_at = unixepoch()'); vals.push(id, orgId);
  await db.prepare(`UPDATE tickets SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`).bind(...vals).run();
}

// ── Ticket Logs ───────────────────────────────────────────────────────────────

export interface TicketLogRow {
  id: string; content: string; type: string; created_at: number; user_name: string | null;
}

export async function getTicketLogs(
  db: D1Database, ticketId: string, orgId: string,
): Promise<TicketLogRow[]> {
  return (await db
    .prepare(
      `SELECT tl.id, tl.content, tl.type, tl.created_at, u.full_name AS user_name
       FROM ticket_logs tl
       LEFT JOIN users u ON u.id = tl.user_id
       WHERE tl.ticket_id = ? AND tl.org_id = ?
       ORDER BY tl.created_at ASC`,
    )
    .bind(ticketId, orgId)
    .all<TicketLogRow>()).results;
}

export async function createTicketLog(
  db: D1Database,
  log: { id: string; orgId: string; ticketId: string; userId?: string; content: string; type: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO ticket_logs (id, org_id, ticket_id, user_id, content, type) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(log.id, log.orgId, log.ticketId, log.userId ?? null, log.content, log.type)
    .run();
}

// ── Messages (contact form) ───────────────────────────────────────────────────

export interface MessageRow {
  id: string; name: string; email: string; message: string; status: string;
  source: string; created_at: number;
  responded_by?: string | null;
  response?:     string | null;
  responded_at?: number | null;
}

export async function getMessages(
  db: D1Database, orgId: string, status?: string,
): Promise<MessageRow[]> {
  const sql = status
    ? 'SELECT * FROM messages WHERE org_id = ? AND status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM messages WHERE org_id = ? ORDER BY created_at DESC';
  const stmt = status ? db.prepare(sql).bind(orgId, status) : db.prepare(sql).bind(orgId);
  return (await stmt.all<MessageRow>()).results;
}

export async function createMessage(
  db: D1Database,
  m: { id: string; orgId: string; name: string; email: string; phone?: string; company?: string; service?: string; message: string; source?: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO messages (id, org_id, name, email, phone, company, service, message, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(m.id, m.orgId, m.name, m.email, m.phone ?? null, m.company ?? null, m.service ?? null, m.message, m.source ?? 'web')
    .run();
}

export async function updateMessageStatus(
  db: D1Database, id: string, orgId: string, status: string, respondedBy?: string, response?: string,
): Promise<void> {
  await db
    .prepare(
      'UPDATE messages SET status = ?, responded_by = ?, response = ?, responded_at = unixepoch(), updated_at = unixepoch() WHERE id = ? AND org_id = ?',
    )
    .bind(status, respondedBy ?? null, response ?? null, id, orgId)
    .run();
}

// ── Newsletter ────────────────────────────────────────────────────────────────

export interface NewsletterRow {
  id: string; email: string; status: string; source: string; created_at: number;
}

export async function getNewsletterSubs(
  db: D1Database, orgId: string,
): Promise<NewsletterRow[]> {
  return (await db
    .prepare('SELECT * FROM newsletter_subs WHERE org_id = ? ORDER BY created_at DESC')
    .bind(orgId)
    .all<NewsletterRow>()).results;
}

export async function createNewsletterSub(
  db: D1Database,
  s: { id: string; orgId: string; email: string; source?: string },
): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO newsletter_subs (id, org_id, email, source) VALUES (?, ?, ?, ?)')
    .bind(s.id, s.orgId, s.email.toLowerCase(), s.source ?? 'web')
    .run();
}

export async function updateNewsletterStatus(
  db: D1Database, id: string, orgId: string, status: string,
): Promise<void> {
  await db
    .prepare('UPDATE newsletter_subs SET status = ?, updated_at = unixepoch() WHERE id = ? AND org_id = ?')
    .bind(status, id, orgId)
    .run();
}
