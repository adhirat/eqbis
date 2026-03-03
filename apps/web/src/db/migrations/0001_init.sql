-- ============================================================
-- 0001_init.sql — Core tables: orgs, users, RBAC, activity, settings, custom domains
-- ============================================================
-- ── Organizations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id            TEXT    PRIMARY KEY,                    -- ULID
  name          TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,                -- subdomain: slug.eqbis.com
  logo_key      TEXT,                                   -- R2 object key
  owner_id      TEXT,                                   -- fk → users.id (set after first user)
  emp_id_prefix TEXT    NOT NULL DEFAULT 'EMP',        -- e.g. "ADH" → ADH-00001
  timezone      TEXT    NOT NULL DEFAULT 'UTC',
  plan          TEXT    NOT NULL DEFAULT 'free',        -- free | pro | enterprise
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT    PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE,
  full_name     TEXT    NOT NULL,
  password_hash TEXT,                                   -- null for SSO-only accounts
  photo_key     TEXT,                                   -- R2 object key
  provider      TEXT    NOT NULL DEFAULT 'email',       -- email | google | ...
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Org Members (user ↔ org membership) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_members (
  id             TEXT    PRIMARY KEY,
  org_id         TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id        TEXT    NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  primary_role_id TEXT,                                -- fk → roles.id (convenience cache)
  joined_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org  ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);

-- ── Roles ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          TEXT    PRIMARY KEY,
  org_id      TEXT,                                    -- NULL = global default role
  name        TEXT    NOT NULL,
  description TEXT,
  color       TEXT    NOT NULL DEFAULT '#6B7280',
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(org_id);

-- ── Role Permissions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id    TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

-- ── User Roles (user ↔ role per org) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, org_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_org ON user_roles(user_id, org_id);

-- ── Activity Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id         TEXT    PRIMARY KEY,
  org_id     TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    TEXT    REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT    NOT NULL,                         -- e.g. 'created_invoice'
  module     TEXT    NOT NULL,                         -- e.g. 'finance'
  entity_id  TEXT,                                     -- ID of affected record
  details    TEXT,                                     -- JSON blob with extra context
  ip         TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_logs(org_id, created_at DESC);

-- ── Organisation Settings (key-value store) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS org_settings (
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key    TEXT NOT NULL,
  value  TEXT NOT NULL,
  PRIMARY KEY (org_id, key)
);

-- ── Invite Tokens ─────────────────────────────────────────────────────────────
-- Stored in KV (key: invite:{token}, value: JSON) for TTL-based expiry.
-- This table is a fallback audit log only.
CREATE TABLE IF NOT EXISTS invite_tokens (
  token      TEXT    PRIMARY KEY,
  org_id     TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email      TEXT    NOT NULL,
  role_id    TEXT    NOT NULL,
  invited_by TEXT    NOT NULL REFERENCES users(id),
  used_at    INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ── Custom Domains (Cloudflare for SaaS) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_domains (
  id                  TEXT    PRIMARY KEY,
  org_id              TEXT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain              TEXT    NOT NULL UNIQUE,         -- e.g. portal.acme.com
  cf_hostname_id      TEXT,                            -- Cloudflare Custom Hostname UUID
  status              TEXT    NOT NULL DEFAULT 'pending',  -- pending|active|failed
  ssl_status          TEXT    NOT NULL DEFAULT 'pending',  -- pending|active|expired
  verification_errors TEXT,                            -- JSON array of CF error msgs
  created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  verified_at         INTEGER
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_org    ON custom_domains(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);   -- hot path
