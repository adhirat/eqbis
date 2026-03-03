/**
 * API v1 — JSON-only mirror of portal functionality.
 * Consumed by the Flutter mobile app.
 * Auth: Authorization: Bearer {jwt}
 * All responses: application/json
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../../../middleware/rbac.js';
import { PERMISSIONS } from '../../../lib/permissions.js';

// DB queries
import { getOrgUsers, getUserById, createUser, updateUser } from '../../../db/queries/users.js';
import { getOrgRoles, getRolePermissions, createRole, setRolePermissions } from '../../../db/queries/roles.js';
import { getOrgById, updateOrg, logActivity, getActivityLogs, getOrgSettings, setOrgSetting, addMember } from '../../../db/queries/orgs.js';
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, getTimesheets, upsertTimesheet, updateTimesheetStatus, getLeaves, createLeave, updateLeaveStatus, getHrDocuments, getCareers, createCareer, getApplications, updateApplicationStatus } from '../../../db/queries/hr.js';
import { getInvoices, getInvoiceById, getNextInvoiceNumber, createInvoice, updateInvoiceStatus, getInvoiceStats, getReceipts, createReceipt } from '../../../db/queries/finance.js';
import { getClients, getClientById, createClient, updateClient, getProjects, getProjectById, createProject, updateProject, getMilestones, createMilestone, getComments, createComment } from '../../../db/queries/crm.js';
import { getTickets, getTicketById, createTicket, updateTicket, getTicketLogs, createTicketLog, getMessages, getNewsletterSubs } from '../../../db/queries/tickets.js';

// Lib
import { ulid } from '../../../lib/id.js';
import { hashPassword } from '../../../lib/password.js';

// Schemas
import {
  CreateUserSchema, AssignRoleSchema,
  CreateRoleSchema,
  CreateEmployeeSchema, TimesheetEntrySchema, ApproveTimesheetSchema,
  LeaveRequestSchema, ApproveLeaveSchema,
  CreateInvoiceSchema, UpdateInvoiceStatusSchema, CreateReceiptSchema,
  CreateClientSchema, CreateProjectSchema, MilestoneSchema, ProjectCommentSchema,
  CreateTicketSchema, TicketReplySchema,
  CreateCareerSchema,
} from '../../../lib/schemas.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const api = new Hono<HonoEnv>();

// Apply auth middleware to all /api/v1/* routes
api.use('*', authMiddleware);

// ── Health ─────────────────────────────────────────────────────────────────────

api.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// ── Dashboard ──────────────────────────────────────────────────────────────────

api.get(
  '/dashboard',
  requireAnyPermission(PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const [employees, invoices, clients, tickets, leaves, activity] = await Promise.all([
      getEmployees(db, orgId, 'active'),
      getInvoices(db, orgId),
      getClients(db, orgId, 'active'),
      getTickets(db, orgId, { status: 'open' }),
      getLeaves(db, orgId, { status: 'pending' }),
      getActivityLogs(db, orgId, 20),
    ]);

    return c.json({
      stats: {
        employees:    employees.length,
        invoicesOpen: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).length,
        invoicesPaid: invoices.filter(i => i.status === 'paid').length,
        clients:      clients.length,
        tickets:      tickets.length,
        pendingLeaves: leaves.length,
      },
      recentActivity: activity,
    });
  },
);

// ── Users ──────────────────────────────────────────────────────────────────────

api.get(
  '/users',
  requirePermission(PERMISSIONS.VIEW_USERS),
  async (c) => {
    const { orgId } = c.get('user');
    return c.json({ users: await getOrgUsers(c.env.DB, orgId) });
  },
);

api.get(
  '/users/:id',
  requirePermission(PERMISSIONS.VIEW_USERS),
  async (c) => {
    const u = await getUserById(c.env.DB, c.req.param('id'));
    if (!u) return c.json({ error: 'Not found' }, 404);
    return c.json({ user: u });
  },
);

api.post(
  '/users',
  requirePermission(PERMISSIONS.MANAGE_USERS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const { email, fullName, password, roleId } = parsed.data;
    const hash = await hashPassword(password ?? Math.random().toString(36));
    const id   = ulid();

    // 1. Create global user record
    await createUser(db, { id, email, full_name: fullName, password_hash: hash });

    // 2. Link to current organisation
    await addMember(db, { id: ulid(), orgId, userId: id, roleId });

    await logActivity(db, { orgId, userId: user.sub, action: 'create', module: 'users', details: `Created user: ${email}` });
    return c.json({ success: true, id }, 201);
  },
);

// ── Roles ──────────────────────────────────────────────────────────────────────

api.get(
  '/roles',
  requireAnyPermission(PERMISSIONS.VIEW_ROLES, PERMISSIONS.MANAGE_ROLES),
  async (c) => {
    const { orgId } = c.get('user');
    return c.json({ roles: await getOrgRoles(c.env.DB, orgId) });
  },
);

api.post(
  '/roles',
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateRoleSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await db.prepare('INSERT INTO roles (id, org_id, name, color) VALUES (?, ?, ?, ?)')
      .bind(id, orgId, parsed.data.name, parsed.data.color ?? '#6366f1').run();

    if (parsed.data.permissions?.length) {
      await setRolePermissions(db, id, parsed.data.permissions);
    }

    return c.json({ success: true, id }, 201);
  },
);

// ── Organisation ───────────────────────────────────────────────────────────────

api.get(
  '/organization',
  requireAnyPermission(PERMISSIONS.VIEW_SETTINGS, PERMISSIONS.MANAGE_SETTINGS),
  async (c) => {
    const { orgId } = c.get('user');
    const org = await getOrgById(c.env.DB, orgId);
    if (!org) return c.json({ error: 'Not found' }, 404);
    return c.json({ organization: org });
  },
);

// ── HR — Employees ─────────────────────────────────────────────────────────────

api.get(
  '/hr/employees',
  requireAnyPermission(PERMISSIONS.VIEW_EMPLOYEES, PERMISSIONS.MANAGE_EMPLOYEES),
  async (c) => {
    const { orgId } = c.get('user');
    const status = c.req.query('status');
    return c.json({ employees: await getEmployees(c.env.DB, orgId, status) });
  },
);

api.get(
  '/hr/employees/:id',
  requireAnyPermission(PERMISSIONS.VIEW_EMPLOYEES, PERMISSIONS.MANAGE_EMPLOYEES),
  async (c) => {
    const { orgId } = c.get('user');
    const emp = await getEmployeeById(c.env.DB, c.req.param('id'), orgId);
    if (!emp) return c.json({ error: 'Not found' }, 404);
    return c.json({ employee: emp });
  },
);

api.post(
  '/hr/employees',
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateEmployeeSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const org = await getOrgById(db, orgId);
    const prefix    = (org as any)?.emp_id_prefix ?? 'EMP';
    const countRow  = await db.prepare('SELECT COUNT(*) AS cnt FROM employees WHERE org_id = ?').bind(orgId).first<{ cnt: number }>();
    const seq       = String((countRow?.cnt ?? 0) + 1).padStart(5, '0');
    const customId  = `${prefix}-${seq}`;

    const id = ulid();
    await createEmployee(db, {
      ...parsed.data,
      userId: parsed.data.userId ?? null,
      id: ulid(),
      orgId,
      customId: `EMP-${Date.now().toString(36).toUpperCase()}`,
    });

    await logActivity(db, { orgId, userId: user.sub, action: 'create', module: 'hr', details: `Added employee: ${parsed.data.firstName} ${parsed.data.lastName}` });
    return c.json({ success: true, id, customId }, 201);
  },
);

// ── HR — Timesheets ────────────────────────────────────────────────────────────

api.get(
  '/hr/timesheets',
  requireAnyPermission(PERMISSIONS.VIEW_TIMESHEETS, PERMISSIONS.MANAGE_TIMESHEETS, PERMISSIONS.SUBMIT_TIMESHEET),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const canManage = user.permissions.includes(PERMISSIONS.MANAGE_TIMESHEETS);
    const userId    = canManage ? c.req.query('userId') : user.sub;

    return c.json({ timesheets: await getTimesheets(db, orgId, { userId: userId ?? undefined }) });
  },
);

api.post(
  '/hr/timesheets',
  requireAnyPermission(PERMISSIONS.SUBMIT_TIMESHEET, PERMISSIONS.MANAGE_TIMESHEETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = TimesheetEntrySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const { date, clockIn, clockOut, notes } = parsed.data;
    let hours: number | undefined;
    if (clockIn && clockOut) {
      const [hi, mi] = clockIn.split(':').map(Number);
      const [ho, mo] = clockOut.split(':').map(Number);
      hours = Math.round(((ho * 60 + mo) - (hi * 60 + mi)) / 60 * 100) / 100;
    }

    const id = ulid();
    await upsertTimesheet(db, { id, orgId, userId: user.sub, date, clockIn, clockOut, hours, notes });
    return c.json({ success: true, id }, 201);
  },
);

// ── HR — Leaves ────────────────────────────────────────────────────────────────

api.get(
  '/hr/leaves',
  requireAnyPermission(PERMISSIONS.VIEW_LEAVES, PERMISSIONS.MANAGE_LEAVES, PERMISSIONS.REQUEST_LEAVE),
  async (c) => {
    const user      = c.get('user');
    const orgId     = user.orgId;
    const canManage = user.permissions.includes(PERMISSIONS.MANAGE_LEAVES);
    const opts      = canManage ? {} : { userId: user.sub };

    return c.json({ leaves: await getLeaves(c.env.DB, orgId, opts) });
  },
);

api.post(
  '/hr/leaves',
  requireAnyPermission(PERMISSIONS.REQUEST_LEAVE, PERMISSIONS.MANAGE_LEAVES),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = LeaveRequestSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const { type, startDate, endDate, reason } = parsed.data;
    const start  = new Date(startDate);
    const end    = new Date(endDate);
    const days   = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    const id = ulid();
    await createLeave(db, { id, orgId, userId: user.sub, type, startDate, endDate, days, reason });
    return c.json({ success: true, id }, 201);
  },
);

// ── Finance — Invoices ─────────────────────────────────────────────────────────

api.get(
  '/finance/invoices',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const { orgId } = c.get('user');
    const status = c.req.query('status');

    const invoices = await getInvoices(c.env.DB, orgId, status);
    const stats    = await getInvoiceStats(c.env.DB, orgId);
    return c.json({ invoices, stats });
  },
);

api.get(
  '/finance/invoices/:id',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const { orgId } = c.get('user');
    const inv = await getInvoiceById(c.env.DB, c.req.param('id'), orgId);
    if (!inv) return c.json({ error: 'Not found' }, 404);
    return c.json({ invoice: inv });
  },
);

api.post(
  '/finance/invoices',
  requirePermission(PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const { clientName, items, notes, clientId, clientEmail, dueDate, issueDate, taxRate } = parsed.data;
    const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    const tax      = subtotal * (taxRate ?? 0);
    const total    = subtotal + tax;

    const id = ulid();
    const invoiceNumber = await getNextInvoiceNumber(db, orgId);

    await createInvoice(db, {
      id,
      orgId,
      clientId,
      clientName,
      clientEmail,
      invoiceNumber,
      dueDate,
      subtotal,
      taxRate: taxRate ?? 0,
      taxAmount: tax,
      total,
      notes,
      createdBy: user.sub,
      items: items.map(i => ({
        ...i,
        id: ulid(),
        total: i.quantity * i.unitPrice,
      })),
    });

    await logActivity(db, { orgId, userId: user.sub, action: 'create', module: 'finance', details: `Created invoice ${invoiceNumber}` });
    return c.json({ success: true, id, invoiceNumber }, 201);
  },
);

api.post(
  '/finance/invoices/:id/status',
  requirePermission(PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const { orgId } = c.get('user');
    const body = await c.req.json();
    const parsed = UpdateInvoiceStatusSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    await updateInvoiceStatus(c.env.DB, c.req.param('id'), orgId, parsed.data.status);
    return c.json({ success: true });
  },
);

// ── Finance — Receipts ─────────────────────────────────────────────────────────

api.get(
  '/finance/receipts',
  requireAnyPermission(PERMISSIONS.VIEW_FINANCE, PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const { orgId } = c.get('user');
    const type = c.req.query('type');
    return c.json({ receipts: await getReceipts(c.env.DB, orgId, type) });
  },
);

api.post(
  '/finance/receipts',
  requirePermission(PERMISSIONS.MANAGE_FINANCE),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateReceiptSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createReceipt(db, { id, orgId, userId: user.sub, ...parsed.data });
    return c.json({ success: true, id }, 201);
  },
);

// ── CRM — Clients ──────────────────────────────────────────────────────────────

api.get(
  '/crm/clients',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const { orgId } = c.get('user');
    const status = c.req.query('status');
    return c.json({ clients: await getClients(c.env.DB, orgId, status) });
  },
);

api.get(
  '/crm/clients/:id',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const { orgId } = c.get('user');
    const cl = await getClientById(c.env.DB, c.req.param('id'), orgId);
    if (!cl) return c.json({ error: 'Not found' }, 404);
    return c.json({ client: cl });
  },
);

api.post(
  '/crm/clients',
  requirePermission(PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateClientSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createClient(db, { id, orgId, ...parsed.data });
    await logActivity(db, { orgId, userId: user.sub, action: 'create', module: 'crm', details: `Added client: ${parsed.data.name}` });
    return c.json({ success: true, id }, 201);
  },
);

// ── Projects ───────────────────────────────────────────────────────────────────

api.get(
  '/projects',
  requireAnyPermission(PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const { orgId } = c.get('user');
    const status = c.req.query('status');
    return c.json({ projects: await getProjects(c.env.DB, orgId, { status: status ?? undefined }) });
  },
);

api.get(
  '/projects/:id',
  requireAnyPermission(PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const { orgId } = c.get('user');
    const [project, milestones, comments] = await Promise.all([
      getProjectById(c.env.DB, c.req.param('id'), orgId),
      getMilestones(c.env.DB, c.req.param('id'), orgId),
      getComments(c.env.DB, c.req.param('id'), orgId),
    ]);
    if (!project) return c.json({ error: 'Not found' }, 404);
    return c.json({ project, milestones, comments });
  },
);

api.post(
  '/projects',
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createProject(db, { id, orgId, createdBy: user.sub, ...parsed.data });
    return c.json({ success: true, id }, 201);
  },
);

api.post(
  '/projects/:id/milestones',
  requirePermission(PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const { orgId } = c.get('user');
    const body   = await c.req.json();
    const parsed = MilestoneSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createMilestone(c.env.DB, { id, orgId, projectId: c.req.param('id'), ...parsed.data });
    return c.json({ success: true, id }, 201);
  },
);

api.post(
  '/projects/:id/comments',
  requireAnyPermission(PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const body   = await c.req.json();
    const parsed = ProjectCommentSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createComment(c.env.DB, { id, orgId, projectId: c.req.param('id'), userId: user.sub, content: parsed.data.content });
    return c.json({ success: true, id }, 201);
  },
);

// ── Support — Tickets ──────────────────────────────────────────────────────────

api.get(
  '/support/tickets',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const { orgId } = c.get('user');
    const status   = c.req.query('status');
    const priority = c.req.query('priority');
    return c.json({ tickets: await getTickets(c.env.DB, orgId, { status, priority }) });
  },
);

api.get(
  '/support/tickets/:id',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const { orgId } = c.get('user');
    const [ticket, logs] = await Promise.all([
      getTicketById(c.env.DB, c.req.param('id'), orgId),
      getTicketLogs(c.env.DB, c.req.param('id'), orgId),
    ]);
    if (!ticket) return c.json({ error: 'Not found' }, 404);
    return c.json({ ticket, logs });
  },
);

api.post(
  '/support/tickets',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateTicketSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createTicket(db, { id, orgId, userId: user.sub, subject: parsed.data.subject, priority: parsed.data.priority ?? 'medium' });
    return c.json({ success: true, id }, 201);
  },
);

api.post(
  '/support/tickets/:id/reply',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = TicketReplySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createTicketLog(db, { id, orgId, ticketId: c.req.param('id'), userId: user.sub, content: parsed.data.content, type: parsed.data.type ?? 'reply' });
    return c.json({ success: true, id }, 201);
  },
);

// ── Communications ─────────────────────────────────────────────────────────────

api.get(
  '/comms/messages',
  requireAnyPermission(PERMISSIONS.VIEW_COMMS, PERMISSIONS.MANAGE_COMMS),
  async (c) => {
    const { orgId } = c.get('user');
    return c.json({ messages: await getMessages(c.env.DB, orgId) });
  },
);

api.get(
  '/comms/newsletter',
  requireAnyPermission(PERMISSIONS.VIEW_COMMS, PERMISSIONS.MANAGE_COMMS),
  async (c) => {
    const { orgId } = c.get('user');
    return c.json({ subscribers: await getNewsletterSubs(c.env.DB, orgId) });
  },
);

// ── HR — Careers & Applications ────────────────────────────────────────────────

api.get(
  '/hr/careers',
  requireAnyPermission(PERMISSIONS.VIEW_CAREERS, PERMISSIONS.MANAGE_CAREERS),
  async (c) => {
    const { orgId } = c.get('user');
    return c.json({ careers: await getCareers(c.env.DB, orgId) });
  },
);

api.post(
  '/hr/careers',
  requirePermission(PERMISSIONS.MANAGE_CAREERS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const body   = await c.req.json();
    const parsed = CreateCareerSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const id = ulid();
    await createCareer(db, { id, orgId, ...parsed.data });
    return c.json({ success: true, id }, 201);
  },
);

api.get(
  '/hr/applications',
  requireAnyPermission(PERMISSIONS.VIEW_APPLICATIONS, PERMISSIONS.MANAGE_APPLICATIONS),
  async (c) => {
    const { orgId } = c.get('user');
    return c.json({ applications: await getApplications(c.env.DB, orgId) });
  },
);

// ── Activity log ───────────────────────────────────────────────────────────────

api.get(
  '/activity',
  requireAnyPermission(PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.MANAGE_SETTINGS),
  async (c) => {
    const { orgId } = c.get('user');
    const limit = parseInt(c.req.query('limit') ?? '50');
    return c.json({ activity: await getActivityLogs(c.env.DB, orgId, Math.min(limit, 200)) });
  },
);

// ── Settings ───────────────────────────────────────────────────────────────────

api.get(
  '/settings',
  requireAnyPermission(PERMISSIONS.VIEW_SETTINGS, PERMISSIONS.MANAGE_SETTINGS),
  async (c) => {
    const { orgId } = c.get('user');
    const settings = await getOrgSettings(c.env.DB, orgId);
    return c.json({ settings });
  },
);

api.put(
  '/settings/:key',
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  async (c) => {
    const { orgId } = c.get('user');
    const key   = c.req.param('key');
    const body  = await c.req.json<{ value: string }>();
    await setOrgSetting(c.env.DB, orgId, key, body.value);
    return c.json({ success: true });
  },
);

// ── Profile (current user) ─────────────────────────────────────────────────────

api.get('/me', (c) => {
  const user = c.get('user');
  return c.json({
    id:          user.sub,
    email:       user.email,
    name:        user.name,
    orgId:       user.orgId,
    orgSlug:     user.orgSlug,
    roles:       user.roles,
    permissions: user.permissions,
    photo:       user.photo,
  });
});

// ── 404 catch-all ──────────────────────────────────────────────────────────────

api.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default api;
