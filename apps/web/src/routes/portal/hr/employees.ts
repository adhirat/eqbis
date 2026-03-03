import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requirePermission } from '../../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../../middleware/csrf.js';
import { ulid } from '../../../lib/id.js';
import { CreateEmployeeSchema, UpdateEmployeeSchema } from '../../../lib/schemas.js';
import { getEmployees, getEmployeeById, createEmployee, updateEmployee } from '../../../db/queries/hr.js';
import { getOrgById, getNextEmployeeId, logActivity } from '../../../db/queries/orgs.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const employees = new Hono<HonoEnv>();

employees.get('/', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), async (c) => {
  const { orgId } = c.get('user');
  const rows = await getEmployees(c.env.DB, orgId);
  if (isApi(c)) return c.json({ employees: rows });

  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Employees — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-lg font-bold text-[var(--text)]">Employees</h2>
      <p class="text-sm text-[var(--text-muted)]">${rows.length} active employees</p>
    </div>
    <a href="/portal/hr/employees/new" class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium flex items-center">+ Add Employee</a>
  </div>
  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>
          ${['ID','Name','Email','Department','Job Title','Status','Actions'].map(h =>
            `<th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${rows.map(e => `
        <tr>
          <td class="px-4 py-2.5 text-[var(--text-muted)] font-mono text-xs">${e.custom_id}</td>
          <td class="px-4 py-2.5 text-[var(--text)] font-medium">${e.first_name} ${e.last_name}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${e.email}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${e.department ?? '—'}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${e.job_title ?? '—'}</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium ${e.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}">${e.status}</span>
          </td>
          <td class="px-4 py-2.5">
            <a href="/portal/hr/employees/${e.id}" class="text-xs text-[var(--accent)] hover:underline">View</a>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div></body></html>`);
});

employees.get('/new', requirePermission(PERMISSIONS.CREATE_EMPLOYEE), async (c) => {
  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Add Employee — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="p-6 max-w-2xl space-y-6">
  <div class="flex items-center gap-3">
    <a href="/portal/hr/employees" class="text-[var(--text-muted)] hover:text-[var(--text)]">← Employees</a>
    <h2 class="text-lg font-bold text-[var(--text)]">Add Employee</h2>
  </div>
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
    <form method="POST" action="/portal/hr/employees" class="space-y-4">
      <input type="hidden" name="_csrf" value="${csrf}">
      <div class="grid grid-cols-2 gap-4">
        ${[
          ['firstName','First Name','text'],['lastName','Last Name','text'],
          ['email','Email','email'],['phone','Phone','tel'],
          ['department','Department','text'],['jobTitle','Job Title','text'],
          ['startDate','Start Date','date'],['salary','Salary','number'],
        ].map(([name, label, type]) => `
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">${label}</label>
          <input name="${name}" type="${type}" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>`).join('')}
      </div>
      <div class="flex gap-3 pt-2">
        <a href="/portal/hr/employees" class="h-9 px-4 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm flex items-center">Cancel</a>
        <button type="submit" class="h-9 px-6 rounded bg-[var(--accent)] text-white font-medium text-sm">Save Employee</button>
      </div>
    </form>
  </div>
</div></body></html>`);
});

employees.post(
  '/',
  requirePermission(PERMISSIONS.CREATE_EMPLOYEE),
  csrfMiddleware,
  zValidator('form', CreateEmployeeSchema),
  async (c) => {
    const { orgId, sub: userId } = c.get('user');
    const data = c.req.valid('form');
    const org = await getOrgById(c.env.DB, orgId);
    const seq = await getNextEmployeeId(c.env.DB, orgId);
    const customId = `${org?.emp_id_prefix ?? 'EMP'}-${String(seq).padStart(5, '0')}`;
    const id = ulid();

    await createEmployee(c.env.DB, {
      id, orgId, userId: null, customId,
      firstName: data.firstName, lastName: data.lastName,
      email: data.email, phone: data.phone,
      department: data.department, jobTitle: data.jobTitle,
      startDate: data.startDate, salary: data.salary,
    });

    await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'created_employee', module: 'hr', entityId: id });

    return isApi(c) ? c.json({ id }) : c.redirect('/portal/hr/employees');
  },
);

employees.get('/:id', requirePermission(PERMISSIONS.VIEW_EMPLOYEES), async (c) => {
  const { orgId } = c.get('user');
  const emp = await getEmployeeById(c.env.DB, c.req.param('id'), orgId);
  if (!emp) return c.json({ error: 'Not found' }, 404);
  if (isApi(c)) return c.json({ employee: emp });

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>${emp.first_name} ${emp.last_name} — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="p-6 max-w-2xl space-y-6">
  <div class="flex items-center gap-3">
    <a href="/portal/hr/employees" class="text-[var(--text-muted)] hover:text-[var(--text)]">← Employees</a>
    <h2 class="text-lg font-bold text-[var(--text)]">${emp.first_name} ${emp.last_name}</h2>
    <span class="text-xs font-mono text-[var(--text-muted)]">${emp.custom_id}</span>
  </div>
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 grid grid-cols-2 gap-4">
    ${[
      ['Email', emp.email],['Phone', emp.phone ?? '—'],
      ['Department', emp.department ?? '—'],['Job Title', emp.job_title ?? '—'],
      ['Start Date', emp.start_date ?? '—'],['Status', emp.status],
    ].map(([label, val]) => `
    <div>
      <p class="text-xs text-[var(--text-muted)]">${label}</p>
      <p class="text-sm text-[var(--text)] mt-0.5">${val}</p>
    </div>`).join('')}
  </div>
</div></body></html>`);
});

export default employees;
