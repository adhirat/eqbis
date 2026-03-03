/**
 * CRM module DB queries — clients, projects, milestones, comments.
 */

// ── Clients ───────────────────────────────────────────────────────────────────

export interface ClientRow {
  id: string; org_id: string; name: string; email: string | null; phone: string | null;
  company: string | null; address: string | null; status: string; notes: string | null;
  created_at: number;
}

export async function getClients(
  db: D1Database, orgId: string, status?: string,
): Promise<ClientRow[]> {
  const sql = status
    ? 'SELECT * FROM clients WHERE org_id = ? AND status = ? ORDER BY name ASC'
    : 'SELECT * FROM clients WHERE org_id = ? ORDER BY name ASC';
  const stmt = status ? db.prepare(sql).bind(orgId, status) : db.prepare(sql).bind(orgId);
  return (await stmt.all<ClientRow>()).results;
}

export async function getClientById(
  db: D1Database, id: string, orgId: string,
): Promise<ClientRow | null> {
  return db.prepare('SELECT * FROM clients WHERE id = ? AND org_id = ? LIMIT 1').bind(id, orgId).first<ClientRow>();
}

export async function createClient(
  db: D1Database,
  c: { id: string; orgId: string; name: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; status: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO clients (id, org_id, name, email, phone, company, address, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(c.id, c.orgId, c.name, c.email ?? null, c.phone ?? null, c.company ?? null, c.address ?? null, c.notes ?? null, c.status)
    .run();
}

export async function updateClient(
  db: D1Database, id: string, orgId: string,
  fields: Partial<{ name: string; email: string; phone: string; company: string; address: string; status: string; notes: string }>,
): Promise<void> {
  const sets: string[] = []; const vals: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (!sets.length) return;
  sets.push('updated_at = unixepoch()'); vals.push(id, orgId);
  await db.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`).bind(...vals).run();
}

// ── Projects ──────────────────────────────────────────────────────────────────

export interface ProjectRow {
  id: string; org_id: string; client_id: string | null; name: string;
  description: string | null; status: string; start_date: string | null;
  end_date: string | null; budget: number | null; created_at: number;
  client_name?: string;
}

export async function getProjects(
  db: D1Database,
  orgId: string,
  opts: { clientId?: string; status?: string } = {},
): Promise<ProjectRow[]> {
  const conditions = ['p.org_id = ?'];
  const vals: unknown[] = [orgId];
  if (opts.clientId) { conditions.push('p.client_id = ?'); vals.push(opts.clientId); }
  if (opts.status)   { conditions.push('p.status = ?');    vals.push(opts.status); }

  return (await db
    .prepare(
      `SELECT p.*, c.name AS client_name FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.created_at DESC`,
    )
    .bind(...vals)
    .all<ProjectRow>()).results;
}

export async function getProjectById(
  db: D1Database, id: string, orgId: string,
): Promise<ProjectRow | null> {
  return db
    .prepare(
      `SELECT p.*, c.name AS client_name FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.id = ? AND p.org_id = ? LIMIT 1`,
    )
    .bind(id, orgId)
    .first<ProjectRow>();
}

export async function createProject(
  db: D1Database,
  p: { id: string; orgId: string; clientId?: string; name: string; description?: string; status: string; startDate?: string; endDate?: string; budget?: number; createdBy?: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO projects (id, org_id, client_id, name, description, status, start_date, end_date, budget, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(p.id, p.orgId, p.clientId ?? null, p.name, p.description ?? null, p.status, p.startDate ?? null, p.endDate ?? null, p.budget ?? null, p.createdBy ?? null)
    .run();
}

export async function updateProject(
  db: D1Database, id: string, orgId: string,
  fields: Partial<{ name: string; description: string; status: string; start_date: string; end_date: string; budget: number; client_id: string }>,
): Promise<void> {
  const sets: string[] = []; const vals: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (!sets.length) return;
  sets.push('updated_at = unixepoch()'); vals.push(id, orgId);
  await db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`).bind(...vals).run();
}

// ── Milestones ────────────────────────────────────────────────────────────────

export interface MilestoneRow {
  id: string; project_id: string; title: string; due_date: string | null; status: string; created_at: number;
}

export async function getMilestones(db: D1Database, projectId: string, orgId: string): Promise<MilestoneRow[]> {
  return (await db
    .prepare('SELECT * FROM project_milestones WHERE project_id = ? AND org_id = ? ORDER BY due_date ASC NULLS LAST')
    .bind(projectId, orgId)
    .all<MilestoneRow>()).results;
}

export async function createMilestone(
  db: D1Database,
  m: { id: string; orgId: string; projectId: string; title: string; dueDate?: string; status?: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO project_milestones (id, org_id, project_id, title, due_date, status) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(m.id, m.orgId, m.projectId, m.title, m.dueDate ?? null, m.status ?? 'pending')
    .run();
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(
  db: D1Database, projectId: string, orgId: string,
): Promise<Array<{ id: string; content: string; created_at: number; user_name: string | null }>> {
  return (await db
    .prepare(
      `SELECT pc.id, pc.content, pc.created_at, u.full_name AS user_name
       FROM project_comments pc
       LEFT JOIN users u ON u.id = pc.user_id
       WHERE pc.project_id = ? AND pc.org_id = ?
       ORDER BY pc.created_at ASC`,
    )
    .bind(projectId, orgId)
    .all<{ id: string; content: string; created_at: number; user_name: string | null }>()).results;
}

export async function createComment(
  db: D1Database,
  c: { id: string; orgId: string; projectId: string; userId: string; content: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO project_comments (id, org_id, project_id, user_id, content) VALUES (?, ?, ?, ?, ?)')
    .bind(c.id, c.orgId, c.projectId, c.userId, c.content)
    .run();
}
