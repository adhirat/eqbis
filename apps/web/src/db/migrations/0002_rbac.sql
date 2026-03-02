-- ============================================================
-- 0002_rbac.sql — Seed default roles and their permissions
-- Ported faithfully from /assets/js/rbac.js DEFAULT_ROLES
-- ============================================================

-- ── Default Roles (org_id = NULL = global defaults) ──────────────────────────
INSERT OR IGNORE INTO roles (id, org_id, name, description, color, is_default) VALUES
  ('role_admin',    NULL, 'Admin',    'Full system access with all permissions', '#8B5CF6', 1),
  ('role_manager',  NULL, 'Manager',  'Can manage employees, view reports, and handle day-to-day operations', '#06B6D4', 1),
  ('role_employee', NULL, 'Employee', 'Standard employee access to self-service features', '#10B981', 1),
  ('role_guest',    NULL, 'Guest',    'No access to portal features - view only public pages', '#6B7280', 1);

-- ── Admin permissions (all) ───────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_admin', 'view_dashboard'),
  ('role_admin', 'view_admin_dashboard'),
  ('role_admin', 'view_employee_dashboard'),
  ('role_admin', 'view_users'),
  ('role_admin', 'create_user'),
  ('role_admin', 'edit_user'),
  ('role_admin', 'delete_user'),
  ('role_admin', 'assign_roles'),
  ('role_admin', 'view_roles'),
  ('role_admin', 'create_role'),
  ('role_admin', 'edit_role'),
  ('role_admin', 'delete_role'),
  ('role_admin', 'view_subscriptions'),
  ('role_admin', 'manage_subscriptions'),
  ('role_admin', 'export_subscriptions'),
  ('role_admin', 'view_submissions'),
  ('role_admin', 'respond_submissions'),
  ('role_admin', 'delete_submissions'),
  ('role_admin', 'export_submissions'),
  ('role_admin', 'view_employees'),
  ('role_admin', 'create_employee'),
  ('role_admin', 'edit_employee'),
  ('role_admin', 'delete_employee'),
  ('role_admin', 'view_applications'),
  ('role_admin', 'manage_applications'),
  ('role_admin', 'view_invoices'),
  ('role_admin', 'create_invoice'),
  ('role_admin', 'edit_invoice'),
  ('role_admin', 'view_payroll'),
  ('role_admin', 'manage_payroll'),
  ('role_admin', 'view_documents'),
  ('role_admin', 'create_document'),
  ('role_admin', 'edit_document'),
  ('role_admin', 'delete_document'),
  ('role_admin', 'view_timesheet'),
  ('role_admin', 'manage_timesheet'),
  ('role_admin', 'approve_timesheet'),
  ('role_admin', 'manage_organization'),
  ('role_admin', 'view_settings'),
  ('role_admin', 'manage_settings'),
  ('role_admin', 'view_calendar'),
  ('role_admin', 'manage_calendar');

-- ── Manager permissions ───────────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_manager', 'view_dashboard'),
  ('role_manager', 'view_employee_dashboard'),
  ('role_manager', 'view_users'),
  ('role_manager', 'view_employees'),
  ('role_manager', 'edit_employee'),
  ('role_manager', 'view_applications'),
  ('role_manager', 'manage_applications'),
  ('role_manager', 'view_invoices'),
  ('role_manager', 'view_payroll'),
  ('role_manager', 'view_documents'),
  ('role_manager', 'view_timesheet'),
  ('role_manager', 'approve_timesheet'),
  ('role_manager', 'view_settings'),
  ('role_manager', 'view_calendar');

-- ── Employee permissions ──────────────────────────────────────────────────────
INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES
  ('role_employee', 'view_dashboard'),
  ('role_employee', 'view_employee_dashboard'),
  ('role_employee', 'view_documents'),
  ('role_employee', 'view_timesheet'),
  ('role_employee', 'view_calendar');

-- Guest has zero permissions (no INSERT needed)
