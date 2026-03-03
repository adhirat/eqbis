/**
 * HR module DB queries — employees, timesheets, leaves, documents, careers, applications.
 * All queries are scoped to org_id.
 */

// ── Employees ─────────────────────────────────────────────────────────────────

export interface EmployeeRow {
  id:           string;
  org_id:       string;
  user_id:      string | null;
  custom_id:    string;
  first_name:   string;
  last_name:    string;
  email:        string;
  phone:        string | null;
  department:   string | null;
  job_title:    string | null;
  start_date:   string | null;
  salary:       number | null;
  status:       string;
  photo_key:    string | null;
  created_at:   number;
}

export async function getEmployees(
  db: D1Database,
  orgId: string,
  status?: string,
): Promise<EmployeeRow[]> {
  const sql = status
    ? 'SELECT * FROM employees WHERE org_id = ? AND status = ? ORDER BY first_name ASC'
    : 'SELECT * FROM employees WHERE org_id = ? ORDER BY first_name ASC';
  const stmt = status
    ? db.prepare(sql).bind(orgId, status)
    : db.prepare(sql).bind(orgId);
  return (await stmt.all<EmployeeRow>()).results;
}

export async function getEmployeeById(
  db: D1Database,
  id: string,
  orgId: string,
): Promise<EmployeeRow | null> {
  return db
    .prepare('SELECT * FROM employees WHERE id = ? AND org_id = ? LIMIT 1')
    .bind(id, orgId)
    .first<EmployeeRow>();
}

export async function createEmployee(
  db: D1Database,
  emp: {
    id: string; orgId: string; userId: string | null; customId: string;
    firstName: string; lastName: string; email: string; phone?: string;
    department?: string; jobTitle?: string; startDate?: string; salary?: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO employees
        (id, org_id, user_id, custom_id, first_name, last_name, email, phone, department, job_title, start_date, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      emp.id, emp.orgId, emp.userId ?? null, emp.customId,
      emp.firstName, emp.lastName, emp.email,
      emp.phone ?? null, emp.department ?? null, emp.jobTitle ?? null,
      emp.startDate ?? null, emp.salary ?? null,
    )
    .run();
}

export async function updateEmployee(
  db: D1Database,
  id: string,
  orgId: string,
  fields: Partial<{
    first_name: string; last_name: string; email: string; phone: string;
    department: string; job_title: string; start_date: string; salary: number;
    status: string; photo_key: string;
  }>,
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length === 0) return;
  sets.push('updated_at = unixepoch()');
  vals.push(id, orgId);
  await db.prepare(`UPDATE employees SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`).bind(...vals).run();
}

// ── Timesheets ────────────────────────────────────────────────────────────────

export interface TimesheetRow {
  id:          string;
  user_id:     string;
  date:        string;
  clock_in:    string | null;
  clock_out:   string | null;
  hours:       number | null;
  notes:       string | null;
  status:      string;
  created_at:  number;
  // joined
  user_name?:  string;
}

export async function getTimesheets(
  db: D1Database,
  orgId: string,
  opts: { userId?: string; status?: string; limit?: number } = {},
): Promise<TimesheetRow[]> {
  const conditions = ['t.org_id = ?'];
  const vals: unknown[] = [orgId];

  if (opts.userId)  { conditions.push('t.user_id = ?');  vals.push(opts.userId); }
  if (opts.status)  { conditions.push('t.status = ?');   vals.push(opts.status); }

  vals.push(opts.limit ?? 100);

  const rows = await db
    .prepare(
      `SELECT t.*, u.full_name AS user_name
       FROM timesheets t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.date DESC
       LIMIT ?`,
    )
    .bind(...vals)
    .all<TimesheetRow>();
  return rows.results;
}

export async function upsertTimesheet(
  db: D1Database,
  entry: {
    id: string; orgId: string; userId: string; employeeId?: string;
    date: string; clockIn?: string; clockOut?: string; hours?: number; notes?: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO timesheets (id, org_id, user_id, employee_id, date, clock_in, clock_out, hours, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(org_id, user_id, date) DO UPDATE SET
         clock_in = excluded.clock_in,
         clock_out = excluded.clock_out,
         hours = excluded.hours,
         notes = excluded.notes,
         updated_at = unixepoch()`,
    )
    .bind(
      entry.id, entry.orgId, entry.userId, entry.employeeId ?? null,
      entry.date, entry.clockIn ?? null, entry.clockOut ?? null,
      entry.hours ?? null, entry.notes ?? null,
    )
    .run();
}

export async function updateTimesheetStatus(
  db: D1Database,
  id: string,
  orgId: string,
  status: string,
  reviewedBy: string,
): Promise<void> {
  await db
    .prepare(
      'UPDATE timesheets SET status = ?, reviewed_by = ?, reviewed_at = unixepoch(), updated_at = unixepoch() WHERE id = ? AND org_id = ?',
    )
    .bind(status, reviewedBy, id, orgId)
    .run();
}

// ── Leaves ────────────────────────────────────────────────────────────────────

export interface LeaveRow {
  id:         string;
  user_id:    string;
  type:       string;
  start_date: string;
  end_date:   string;
  days:       number | null;
  reason:     string | null;
  status:     string;
  created_at: number;
  user_name?: string;
}

export async function getLeaves(
  db: D1Database,
  orgId: string,
  opts: { userId?: string; status?: string } = {},
): Promise<LeaveRow[]> {
  const conditions = ['l.org_id = ?'];
  const vals: unknown[] = [orgId];

  if (opts.userId) { conditions.push('l.user_id = ?'); vals.push(opts.userId); }
  if (opts.status) { conditions.push('l.status = ?');  vals.push(opts.status); }

  const rows = await db
    .prepare(
      `SELECT l.*, u.full_name AS user_name
       FROM leaves l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY l.created_at DESC`,
    )
    .bind(...vals)
    .all<LeaveRow>();
  return rows.results;
}

export async function createLeave(
  db: D1Database,
  leave: {
    id: string; orgId: string; userId: string; employeeId?: string;
    type: string; startDate: string; endDate: string; days?: number; reason?: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO leaves (id, org_id, user_id, employee_id, type, start_date, end_date, days, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      leave.id, leave.orgId, leave.userId, leave.employeeId ?? null,
      leave.type, leave.startDate, leave.endDate, leave.days ?? null, leave.reason ?? null,
    )
    .run();
}

export async function updateLeaveStatus(
  db: D1Database,
  id: string,
  orgId: string,
  status: string,
  reviewedBy: string,
  notes?: string,
): Promise<void> {
  await db
    .prepare(
      'UPDATE leaves SET status = ?, reviewed_by = ?, reviewed_at = unixepoch(), notes = ?, updated_at = unixepoch() WHERE id = ? AND org_id = ?',
    )
    .bind(status, reviewedBy, notes ?? null, id, orgId)
    .run();
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getHrDocuments(
  db: D1Database,
  orgId: string,
  employeeId?: string,
): Promise<Array<{ id: string; title: string; type: string; file_name: string; file_key: string; created_at: number; user_name: string | null }>> {
  const sql = employeeId
    ? `SELECT d.*, u.full_name AS user_name FROM hr_documents d LEFT JOIN users u ON u.id = d.user_id WHERE d.org_id = ? AND d.employee_id = ? ORDER BY d.created_at DESC`
    : `SELECT d.*, u.full_name AS user_name FROM hr_documents d LEFT JOIN users u ON u.id = d.user_id WHERE d.org_id = ? ORDER BY d.created_at DESC`;
  const stmt = employeeId ? db.prepare(sql).bind(orgId, employeeId) : db.prepare(sql).bind(orgId);
  return (await stmt.all<{ id: string; title: string; type: string; file_name: string; file_key: string; created_at: number; user_name: string | null }>()).results;
}

export async function createHrDocument(
  db: D1Database,
  doc: { id: string; orgId: string; userId?: string; employeeId?: string; title: string; type: string; fileKey: string; fileName: string; fileSize?: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO hr_documents (id, org_id, user_id, employee_id, title, type, file_key, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      doc.id, doc.orgId, doc.userId ?? null, doc.employeeId ?? null,
      doc.title, doc.type, doc.fileKey, doc.fileName, doc.fileSize ?? null,
    )
    .run();
}

// ── Careers ───────────────────────────────────────────────────────────────────

export interface CareerRow {
  id: string; org_id: string; title: string; department: string | null;
  type: string; location: string | null; description: string; is_active: number; created_at: number;
}

export async function getCareers(db: D1Database, orgId: string, activeOnly = true): Promise<CareerRow[]> {
  const sql = activeOnly
    ? 'SELECT * FROM careers WHERE org_id = ? AND is_active = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM careers WHERE org_id = ? ORDER BY created_at DESC';
  return (await db.prepare(sql).bind(orgId).all<CareerRow>()).results;
}

export async function createCareer(
  db: D1Database,
  career: { id: string; orgId: string; title: string; department?: string; type: string; location?: string; description: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO careers (id, org_id, title, department, type, location, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(career.id, career.orgId, career.title, career.department ?? null, career.type, career.location ?? null, career.description)
    .run();
}

// ── Applications ──────────────────────────────────────────────────────────────

export interface ApplicationRow {
  id: string; org_id: string; career_id: string | null; applicant_name: string;
  email: string; phone: string | null; status: string; created_at: number;
  career_title?: string;
}

export async function getApplications(db: D1Database, orgId: string): Promise<ApplicationRow[]> {
  return (await db
    .prepare(
      `SELECT a.*, c.title AS career_title FROM applications a
       LEFT JOIN careers c ON c.id = a.career_id
       WHERE a.org_id = ? ORDER BY a.created_at DESC`,
    )
    .bind(orgId)
    .all<ApplicationRow>()).results;
}

export async function createApplication(
  db: D1Database,
  app: { id: string; orgId: string; careerId?: string; name: string; email: string; phone?: string; resumeKey?: string; coverLetter?: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO applications (id, org_id, career_id, applicant_name, email, phone, resume_key, cover_letter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(app.id, app.orgId, app.careerId ?? null, app.name, app.email, app.phone ?? null, app.resumeKey ?? null, app.coverLetter ?? null)
    .run();
}

export async function updateApplicationStatus(
  db: D1Database, id: string, orgId: string, status: string,
): Promise<void> {
  await db
    .prepare('UPDATE applications SET status = ?, updated_at = unixepoch() WHERE id = ? AND org_id = ?')
    .bind(status, id, orgId)
    .run();
}
