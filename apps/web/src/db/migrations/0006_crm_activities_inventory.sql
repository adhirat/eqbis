-- ============================================================
-- 0006_crm_activities_inventory.sql
-- Adds CRM Sales, Activities, Inventory, and Support tables.
-- ============================================================

-- ── CRM: Leads ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL DEFAULT '',
  company      TEXT,
  email        TEXT,
  phone        TEXT,
  lead_source  TEXT DEFAULT 'other',     -- web/email/phone/social/referral/other
  status       TEXT DEFAULT 'new',        -- new/contacted/qualified/lost
  rating       TEXT DEFAULT 'warm',       -- hot/warm/cold
  assigned_to  TEXT REFERENCES users(id),
  notes        TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(org_id);

-- ── CRM: Contacts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL DEFAULT '',
  email       TEXT,
  phone       TEXT,
  title       TEXT,
  account_id  TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(org_id);

-- ── CRM: Accounts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  industry    TEXT DEFAULT 'other',
  website     TEXT,
  phone       TEXT,
  address     TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_accounts_org ON accounts(org_id);

-- ── CRM: Deals ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  account_id   TEXT,
  account_name TEXT,
  amount       REAL DEFAULT 0,
  stage        TEXT DEFAULT 'prospecting',  -- prospecting/qualification/proposal/negotiation/closed_won/closed_lost
  close_date   TEXT,
  assigned_to  TEXT REFERENCES users(id),
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(org_id);

-- ── CRM: Campaigns ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'email',      -- email/social/search/event/other
  status      TEXT DEFAULT 'planning',   -- planning/active/paused/completed
  start_date  TEXT,
  end_date    TEXT,
  budget      REAL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(org_id);

-- ── CRM: Forecasts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forecasts (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id        TEXT REFERENCES users(id),
  user_name      TEXT,
  period         TEXT NOT NULL,           -- e.g. "Q1 2026"
  quota          REAL DEFAULT 0,
  pipeline_value REAL DEFAULT 0,
  closed_value   REAL DEFAULT 0,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_forecasts_org ON forecasts(org_id);

-- ── Activities: Tasks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL,
  status           TEXT DEFAULT 'open',     -- open/in_progress/completed/deferred
  priority         TEXT DEFAULT 'medium',   -- high/medium/low
  due_date         TEXT,
  assigned_to      TEXT REFERENCES users(id),
  assigned_to_name TEXT,
  related_to       TEXT,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(org_id);

-- ── Activities: Meetings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  start_time  TEXT,
  end_time    TEXT,
  location    TEXT,
  description TEXT,
  host_id     TEXT REFERENCES users(id),
  host_name   TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(org_id);

-- ── Activities: Calls ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL,
  call_type        TEXT DEFAULT 'outbound',   -- inbound/outbound
  status           TEXT DEFAULT 'completed',  -- scheduled/completed/missed/cancelled
  duration_seconds INTEGER DEFAULT 0,
  call_from        TEXT,
  call_to          TEXT,
  description      TEXT,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_calls_org ON calls(org_id);

-- ── Inventory: Products ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                 TEXT PRIMARY KEY,
  org_id             TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  product_code       TEXT,
  unit_price         REAL DEFAULT 0,
  quantity_in_stock  INTEGER DEFAULT 0,
  description        TEXT,
  created_at         INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id);

-- ── Inventory: Price Books ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_books (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  currency    TEXT DEFAULT 'USD',
  is_active   INTEGER DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_price_books_org ON price_books(org_id);

-- ── Inventory: Quotes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  quote_title  TEXT NOT NULL,
  account_id   TEXT,
  account_name TEXT,
  total_amount REAL DEFAULT 0,
  status       TEXT DEFAULT 'draft',  -- draft/sent/accepted/rejected/expired
  valid_until  TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(org_id);

-- ── Inventory: Sales Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_orders (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  account_id   TEXT,
  account_name TEXT,
  status       TEXT DEFAULT 'created',  -- created/confirmed/shipped/delivered/cancelled
  total_amount REAL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_sales_orders_org ON sales_orders(org_id);

-- ── Inventory: Purchase Orders ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  vendor_id    TEXT,
  vendor_name  TEXT,
  status       TEXT DEFAULT 'draft',  -- draft/sent/confirmed/received/cancelled
  total_amount REAL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(org_id);

-- ── Inventory: Vendors ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  website     TEXT,
  address     TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(org_id);

-- ── Support: Cases ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  account_id   TEXT,
  account_name TEXT,
  status       TEXT DEFAULT 'new',     -- new/open/pending/closed
  priority     TEXT DEFAULT 'medium',  -- high/medium/low
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_cases_org ON cases(org_id);

-- ── Support: Solutions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solutions (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  category   TEXT DEFAULT 'General',
  status     TEXT DEFAULT 'draft',  -- draft/published/archived
  content    TEXT,
  views      INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_solutions_org ON solutions(org_id);
