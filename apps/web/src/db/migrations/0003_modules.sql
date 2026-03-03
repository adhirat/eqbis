-- ============================================================
-- 0003_modules.sql — Feature module tables
-- HR, Finance, CRM, Projects, Communications, Support
-- ============================================================
-- ── HR: Employees ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id           TEXT    PRIMARY KEY,
  org_id       TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      TEXT    REFERENCES users(id) ON DELETE SET NULL,  -- linked portal user
  custom_id    TEXT    NOT NULL,                                  -- e.g. ADH-00001
  first_name   TEXT    NOT NULL,
  last_name    TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  phone        TEXT,
  department   TEXT,
  job_title    TEXT,
  start_date   TEXT,                                              -- YYYY-MM-DD
  end_date     TEXT,
  salary       REAL,
  status       TEXT    NOT NULL DEFAULT 'active',                 -- active|inactive|terminated
  photo_key    TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(org_id, custom_id)
);

CREATE INDEX IF NOT EXISTS idx_employees_org    ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(org_id, status);

-- ── HR: Timesheets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timesheets (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT    REFERENCES employees(id) ON DELETE SET NULL,
  date        TEXT    NOT NULL,     -- YYYY-MM-DD
  clock_in    TEXT,                 -- HH:MM
  clock_out   TEXT,
  hours       REAL,                 -- computed: clock_out - clock_in
  notes       TEXT,
  status      TEXT    NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
  reviewed_by TEXT    REFERENCES users(id),
  reviewed_at INTEGER,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(org_id, user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_timesheets_org      ON timesheets(org_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_user_org ON timesheets(user_id, org_id);

-- ── HR: Leaves ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaves (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT    REFERENCES employees(id) ON DELETE SET NULL,
  type        TEXT    NOT NULL DEFAULT 'annual', -- annual|sick|personal|unpaid|other
  start_date  TEXT    NOT NULL,   -- YYYY-MM-DD
  end_date    TEXT    NOT NULL,
  days        REAL,               -- computed
  reason      TEXT,
  status      TEXT    NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
  reviewed_by TEXT    REFERENCES users(id),
  reviewed_at INTEGER,
  notes       TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_leaves_org      ON leaves(org_id);
CREATE INDEX IF NOT EXISTS idx_leaves_user_org ON leaves(user_id, org_id);

-- ── HR: Documents ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_documents (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     TEXT    REFERENCES users(id) ON DELETE SET NULL,  -- owner/uploaded-by
  employee_id TEXT    REFERENCES employees(id) ON DELETE SET NULL,
  title       TEXT    NOT NULL,
  type        TEXT    NOT NULL DEFAULT 'other',  -- contract|payslip|certificate|policy|other
  file_key    TEXT    NOT NULL,                  -- R2 object key
  file_name   TEXT    NOT NULL,
  file_size   INTEGER,
  is_shared   INTEGER NOT NULL DEFAULT 0,        -- visible to the employee
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_hr_documents_org      ON hr_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_employee ON hr_documents(employee_id);

-- ── HR: Careers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS careers (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  department  TEXT,
  type        TEXT    NOT NULL DEFAULT 'full_time', -- full_time|part_time|contract|internship
  location    TEXT,
  description TEXT    NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_careers_org ON careers(org_id, is_active);

-- ── HR: Applications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id             TEXT    PRIMARY KEY,
  org_id         TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  career_id      TEXT    REFERENCES careers(id) ON DELETE SET NULL,
  applicant_name TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  phone          TEXT,
  resume_key     TEXT,   -- R2 object key
  cover_letter   TEXT,
  status         TEXT    NOT NULL DEFAULT 'new', -- new|reviewing|shortlisted|rejected|hired
  notes          TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_applications_org    ON applications(org_id);
CREATE INDEX IF NOT EXISTS idx_applications_career ON applications(career_id);

-- ── Finance: Invoices ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT    PRIMARY KEY,
  org_id         TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id      TEXT    REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT    NOT NULL,    -- e.g. INV-202501-0001 (unique per org)
  client_name    TEXT    NOT NULL,
  client_email   TEXT,
  issue_date     TEXT    NOT NULL DEFAULT (date('now')),  -- YYYY-MM-DD
  due_date       TEXT,
  status         TEXT    NOT NULL DEFAULT 'draft', -- draft|sent|paid|overdue|cancelled
  subtotal       REAL    NOT NULL DEFAULT 0,
  tax_rate       REAL    NOT NULL DEFAULT 0,
  tax_amount     REAL    NOT NULL DEFAULT 0,
  total          REAL    NOT NULL DEFAULT 0,
  notes          TEXT,
  created_by     TEXT    REFERENCES users(id),
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(org_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_org    ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(org_id, status);

-- ── Finance: Invoice Items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          TEXT  PRIMARY KEY,
  invoice_id  TEXT  NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT  NOT NULL,
  quantity    REAL  NOT NULL DEFAULT 1,
  unit_price  REAL  NOT NULL DEFAULT 0,
  total       REAL  NOT NULL DEFAULT 0  -- quantity * unit_price
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ── Finance: Receipts / Expenses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     TEXT    REFERENCES users(id) ON DELETE SET NULL,
  title       TEXT    NOT NULL,
  amount      REAL    NOT NULL,
  type        TEXT    NOT NULL DEFAULT 'expense', -- income|expense
  category    TEXT,
  period      TEXT,   -- YYYY-MM
  file_key    TEXT,   -- R2 object key for scanned receipt
  notes       TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_receipts_org ON receipts(org_id);

-- ── CRM: Clients ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         TEXT    PRIMARY KEY,
  org_id     TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  email      TEXT,
  phone      TEXT,
  company    TEXT,
  address    TEXT,
  status     TEXT    NOT NULL DEFAULT 'active',  -- active|inactive|lead
  notes      TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id);

-- ── Projects ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id   TEXT    REFERENCES clients(id) ON DELETE SET NULL,
  name        TEXT    NOT NULL,
  description TEXT,
  status      TEXT    NOT NULL DEFAULT 'planning', -- planning|active|on_hold|completed|cancelled
  start_date  TEXT,
  end_date    TEXT,
  budget      REAL,
  created_by  TEXT    REFERENCES users(id),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_projects_org    ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(org_id, status);

-- ── Projects: Milestones ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_milestones (
  id         TEXT    PRIMARY KEY,
  org_id     TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  due_date   TEXT,
  status     TEXT    NOT NULL DEFAULT 'pending', -- pending|in_progress|completed
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);

-- ── Projects: Comments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_comments (
  id         TEXT    PRIMARY KEY,
  org_id     TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    TEXT    REFERENCES users(id) ON DELETE SET NULL,
  content    TEXT    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comments_project ON project_comments(project_id);

-- ── Comms: Messages (Contact form) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         TEXT    PRIMARY KEY,
  org_id     TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  phone      TEXT,
  company    TEXT,
  service    TEXT,
  message    TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'new', -- new|read|responded|archived
  response   TEXT,
  source     TEXT    NOT NULL DEFAULT 'web', -- web|portal
  responded_at INTEGER,
  responded_by TEXT  REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_messages_org    ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(org_id, status);

-- ── Comms: Newsletter Subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subs (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'active',  -- active|unsubscribed|bounced
  source      TEXT    NOT NULL DEFAULT 'web',
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_org ON newsletter_subs(org_id);

-- ── Support: Tickets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     TEXT    REFERENCES users(id) ON DELETE SET NULL,  -- submitter
  subject     TEXT    NOT NULL,
  priority    TEXT    NOT NULL DEFAULT 'medium',  -- low|medium|high|urgent
  status      TEXT    NOT NULL DEFAULT 'open',    -- open|in_progress|resolved|closed
  assigned_to TEXT    REFERENCES users(id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_tickets_org    ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(org_id, status);

-- ── Support: Ticket Logs (thread) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_logs (
  id         TEXT    PRIMARY KEY,
  org_id     TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id  TEXT    NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    TEXT    REFERENCES users(id) ON DELETE SET NULL,
  content    TEXT    NOT NULL,
  type       TEXT    NOT NULL DEFAULT 'reply',  -- reply|internal_note|status_change
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket ON ticket_logs(ticket_id);

-- ── FTS5 Virtual Tables (full-text search) ────────────────────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS users_fts USING fts5(
  full_name, email,
  content=users, content_rowid=rowid
);

CREATE VIRTUAL TABLE IF NOT EXISTS clients_fts USING fts5(
  name, email, company,
  content=clients, content_rowid=rowid
);

CREATE VIRTUAL TABLE IF NOT EXISTS employees_fts USING fts5(
  first_name, last_name, email, department, job_title,
  content=employees, content_rowid=rowid
);
