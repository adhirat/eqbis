-- ============================================================
-- 0005_extended_permissions.sql
-- Seed extended module-level permissions for all default roles.
-- Covers CRM, Finance, Comms, Timesheets/Leaves, Careers, Users/Roles mgmt.
-- ============================================================

-- ── Admin: all new permissions ────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_admin', 'manage_users'),
  ('role_admin', 'manage_roles'),
  ('role_admin', 'view_careers'),
  ('role_admin', 'manage_careers'),
  ('role_admin', 'view_finance'),
  ('role_admin', 'manage_finance'),
  ('role_admin', 'manage_employees'),
  ('role_admin', 'view_timesheets'),
  ('role_admin', 'manage_timesheets'),
  ('role_admin', 'submit_timesheet'),
  ('role_admin', 'view_leaves'),
  ('role_admin', 'manage_leaves'),
  ('role_admin', 'request_leave'),
  ('role_admin', 'view_crm'),
  ('role_admin', 'manage_crm'),
  ('role_admin', 'view_comms'),
  ('role_admin', 'manage_comms');

-- ── Manager permissions ───────────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_manager', 'view_roles'),
  ('role_manager', 'view_careers'),
  ('role_manager', 'view_finance'),
  ('role_manager', 'manage_employees'),
  ('role_manager', 'view_timesheets'),
  ('role_manager', 'manage_timesheets'),
  ('role_manager', 'submit_timesheet'),
  ('role_manager', 'view_leaves'),
  ('role_manager', 'manage_leaves'),
  ('role_manager', 'request_leave'),
  ('role_manager', 'view_crm'),
  ('role_manager', 'view_comms'),
  ('role_manager', 'view_tickets'),
  ('role_manager', 'manage_tickets');

-- ── Employee permissions ──────────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_employee', 'view_timesheets'),
  ('role_employee', 'submit_timesheet'),
  ('role_employee', 'view_leaves'),
  ('role_employee', 'request_leave'),
  ('role_employee', 'view_tickets');
