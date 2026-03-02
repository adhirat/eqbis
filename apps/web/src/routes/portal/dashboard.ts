/**
 * Portal dashboard route — /portal
 */

import { Hono } from 'hono';
import type { Env } from '../../types/env.js';
import type { AuthVariables } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import { requireAnyPermission } from '../../middleware/rbac.js';
import { getEmployees } from '../../db/queries/hr.js';
import { getInvoices } from '../../db/queries/finance.js';
import { getClients } from '../../db/queries/crm.js';
import { getTickets } from '../../db/queries/tickets.js';
import { getLeaves } from '../../db/queries/hr.js';
import { getActivityLogs } from '../../db/queries/orgs.js';
import { renderDashboard } from '../../views/portal/dashboard.js';
import { isApi } from '../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const dashboard = new Hono<HonoEnv>();

dashboard.get(
  '/',
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

    const stats = {
      employees:    employees.length,
      invoicesOpen: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).length,
      invoicesPaid: invoices.filter(i => i.status === 'paid').length,
      clients:      clients.length,
      tickets:      tickets.length,
      pendingLeaves: leaves.length,
    };

    if (isApi(c)) {
      return c.json({ stats, recentActivity: activity });
    }

    return c.html(renderDashboard({ stats, recentActivity: activity, user }));
  },
);

export default dashboard;
