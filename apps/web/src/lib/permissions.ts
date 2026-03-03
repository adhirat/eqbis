/**
 * All permission strings — ported faithfully from legacy /assets/js/rbac.js,
 * extended with granular module-level permissions for the new portal routes.
 * Used in JWT payload, middleware/rbac.ts, and D1 role_permissions seed.
 */
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD:          'view_dashboard',
  VIEW_ADMIN_DASHBOARD:    'view_admin_dashboard',
  VIEW_EMPLOYEE_DASHBOARD: 'view_employee_dashboard',

  // User management
  VIEW_USERS:    'view_users',
  MANAGE_USERS:  'manage_users',
  CREATE_USER:   'create_user',
  EDIT_USER:     'edit_user',
  DELETE_USER:   'delete_user',
  ASSIGN_ROLES:  'assign_roles',

  // Role management
  VIEW_ROLES:   'view_roles',
  MANAGE_ROLES: 'manage_roles',
  CREATE_ROLE:  'create_role',
  EDIT_ROLE:    'edit_role',
  DELETE_ROLE:  'delete_role',

  // Newsletter subscriptions
  VIEW_SUBSCRIPTIONS:   'view_subscriptions',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  EXPORT_SUBSCRIPTIONS: 'export_subscriptions',

  // Contact form submissions
  VIEW_SUBMISSIONS:    'view_submissions',
  RESPOND_SUBMISSIONS: 'respond_submissions',
  DELETE_SUBMISSIONS:  'delete_submissions',
  EXPORT_SUBMISSIONS:  'export_submissions',

  // Employee management (HR admin)
  VIEW_EMPLOYEES:    'view_employees',
  MANAGE_EMPLOYEES:  'manage_employees',
  CREATE_EMPLOYEE:   'create_employee',
  EDIT_EMPLOYEE:     'edit_employee',
  DELETE_EMPLOYEE:   'delete_employee',

  // Recruitment
  VIEW_CAREERS:        'view_careers',
  MANAGE_CAREERS:      'manage_careers',
  VIEW_APPLICATIONS:   'view_applications',
  MANAGE_APPLICATIONS: 'manage_applications',

  // Finance
  VIEW_FINANCE:    'view_finance',
  MANAGE_FINANCE:  'manage_finance',
  VIEW_INVOICES:   'view_invoices',
  CREATE_INVOICE:  'create_invoice',
  EDIT_INVOICE:    'edit_invoice',
  VIEW_PAYROLL:    'view_payroll',
  MANAGE_PAYROLL:  'manage_payroll',

  // Documents
  VIEW_DOCUMENTS:   'view_documents',
  CREATE_DOCUMENT:  'create_document',
  EDIT_DOCUMENT:    'edit_document',
  DELETE_DOCUMENT:  'delete_document',

  // Timesheets & Leaves
  VIEW_TIMESHEET:    'view_timesheet',
  VIEW_TIMESHEETS:   'view_timesheets',
  MANAGE_TIMESHEET:  'manage_timesheet',
  MANAGE_TIMESHEETS: 'manage_timesheets',
  APPROVE_TIMESHEET: 'approve_timesheet',
  SUBMIT_TIMESHEET:  'submit_timesheet',
  VIEW_LEAVES:       'view_leaves',
  MANAGE_LEAVES:     'manage_leaves',
  REQUEST_LEAVE:     'request_leave',

  // Organisation
  MANAGE_ORGANIZATION: 'manage_organization',

  // Settings
  VIEW_SETTINGS:   'view_settings',
  MANAGE_SETTINGS: 'manage_settings',

  // Calendar
  VIEW_CALENDAR:   'view_calendar',
  MANAGE_CALENDAR: 'manage_calendar',

  // CRM
  VIEW_CRM:   'view_crm',
  MANAGE_CRM: 'manage_crm',

  // Projects
  VIEW_PROJECTS:   'view_projects',
  MANAGE_PROJECTS: 'manage_projects',

  // Communications
  VIEW_COMMS:   'view_comms',
  MANAGE_COMMS: 'manage_comms',

  // Support tickets + cases + solutions
  VIEW_TICKETS:   'view_tickets',
  MANAGE_TICKETS: 'manage_tickets',
  VIEW_CASES:     'view_cases',
  MANAGE_CASES:   'manage_cases',
  VIEW_SOLUTIONS: 'view_solutions',
  MANAGE_SOLUTIONS: 'manage_solutions',

  // Activities (tasks, meetings, calls)
  VIEW_ACTIVITIES:   'view_activities',
  MANAGE_ACTIVITIES: 'manage_activities',

  // Inventory (products, quotes, orders, vendors)
  VIEW_INVENTORY:   'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/** Permissions sets for each default role */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ALL_PERMISSIONS,

  manager: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.EDIT_EMPLOYEE,
    PERMISSIONS.VIEW_CAREERS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.MANAGE_APPLICATIONS,
    PERMISSIONS.VIEW_FINANCE,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_TIMESHEET,
    PERMISSIONS.VIEW_TIMESHEETS,
    PERMISSIONS.APPROVE_TIMESHEET,
    PERMISSIONS.SUBMIT_TIMESHEET,
    PERMISSIONS.VIEW_LEAVES,
    PERMISSIONS.MANAGE_LEAVES,
    PERMISSIONS.REQUEST_LEAVE,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.VIEW_COMMS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.VIEW_CASES,
    PERMISSIONS.MANAGE_CASES,
    PERMISSIONS.VIEW_SOLUTIONS,
    PERMISSIONS.VIEW_ACTIVITIES,
    PERMISSIONS.MANAGE_ACTIVITIES,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_CALENDAR,
  ],

  employee: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_TIMESHEET,
    PERMISSIONS.VIEW_TIMESHEETS,
    PERMISSIONS.SUBMIT_TIMESHEET,
    PERMISSIONS.VIEW_LEAVES,
    PERMISSIONS.REQUEST_LEAVE,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_TICKETS,
    PERMISSIONS.VIEW_CALENDAR,
  ],

  guest: [],
};
