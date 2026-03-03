-- ============================================================
-- 0004_additional_permissions.sql
-- Add project and ticket permissions to existing default roles.
-- ============================================================

-- ── Admin: all new permissions ────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_admin', 'view_projects'),
  ('role_admin', 'manage_projects'),
  ('role_admin', 'view_tickets'),
  ('role_admin', 'manage_tickets');

-- ── Manager: view + manage ────────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_manager', 'view_projects'),
  ('role_manager', 'manage_projects'),
  ('role_manager', 'view_tickets'),
  ('role_manager', 'manage_tickets');

-- ── Employee: view only ───────────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_employee', 'view_projects'),
  ('role_employee', 'view_tickets');
