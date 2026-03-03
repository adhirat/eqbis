import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requirePermission } from '../../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../../middleware/csrf.js';
import { ulid } from '../../../lib/id.js';
import { TimesheetEntrySchema, ApproveTimesheetSchema } from '../../../lib/schemas.js';
import { getTimesheets, upsertTimesheet, updateTimesheetStatus } from '../../../db/queries/hr.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const timesheets = new Hono<HonoEnv>();

timesheets.get('/', requirePermission(PERMISSIONS.VIEW_TIMESHEET), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const perms = new Set(c.get('user').permissions);
  const isAdmin = perms.has(PERMISSIONS.APPROVE_TIMESHEET);

  const rows = await getTimesheets(c.env.DB, orgId, isAdmin ? {} : { userId });
  if (isApi(c)) return c.json({ timesheets: rows });

  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Timesheets — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-[var(--text)]">Timesheets</h2>
    <button onclick="document.getElementById('log-modal').classList.remove('hidden')"
      class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium">+ Log Time</button>
  </div>
  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>
          ${(isAdmin ? ['Employee','Date','In','Out','Hours','Status','Actions'] : ['Date','In','Out','Hours','Status']).map(h =>
            `<th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${rows.map(t => `
        <tr>
          ${isAdmin ? `<td class="px-4 py-2.5 text-[var(--text)]">${t.user_name ?? '—'}</td>` : ''}
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${t.date}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${t.clock_in ?? '—'}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${t.clock_out ?? '—'}</td>
          <td class="px-4 py-2.5 text-[var(--text)]">${t.hours != null ? t.hours.toFixed(2) : '—'}</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium ${t.status === 'approved' ? 'bg-green-500/15 text-green-400' : t.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}">${t.status}</span>
          </td>
          ${isAdmin && t.status === 'pending' ? `
          <td class="px-4 py-2.5 flex gap-2">
            <form method="POST" action="/portal/hr/timesheets/${t.id}/approve">
              <input type="hidden" name="_csrf" value="${csrf}">
              <input type="hidden" name="status" value="approved">
              <button type="submit" class="text-xs text-green-400 hover:underline">Approve</button>
            </form>
            <form method="POST" action="/portal/hr/timesheets/${t.id}/approve">
              <input type="hidden" name="_csrf" value="${csrf}">
              <input type="hidden" name="status" value="rejected">
              <button type="submit" class="text-xs text-red-400 hover:underline">Reject</button>
            </form>
          </td>` : isAdmin ? '<td></td>' : ''}
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div id="log-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/60" onclick="document.getElementById('log-modal').classList.add('hidden')"></div>
    <div class="relative z-10 w-full max-w-md mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      <h3 class="font-semibold text-[var(--text)]">Log Time</h3>
      <form method="POST" action="/portal/hr/timesheets" class="space-y-4">
        <input type="hidden" name="_csrf" value="${csrf}">
        ${[['date','Date','date'],['clockIn','Clock In','time'],['clockOut','Clock Out','time']].map(([name, label, type]) => `
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">${label}</label>
          <input name="${name}" type="${type}" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>`).join('')}
        <div class="flex gap-2">
          <button type="button" onclick="document.getElementById('log-modal').classList.add('hidden')"
            class="flex-1 h-9 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button type="submit" class="flex-1 h-9 rounded bg-[var(--accent)] text-white font-medium text-sm">Submit</button>
        </div>
      </form>
    </div>
  </div>
</div></body></html>`);
});

timesheets.post('/', requirePermission(PERMISSIONS.VIEW_TIMESHEET), csrfMiddleware, zValidator('form', TimesheetEntrySchema), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const data = c.req.valid('form');
  let hours: number | undefined;
  if (data.clockIn && data.clockOut) {
    const [ih, im] = data.clockIn.split(':').map(Number);
    const [oh, om] = data.clockOut.split(':').map(Number);
    hours = Math.max(0, (oh * 60 + om - ih * 60 - im) / 60);
  }
  await upsertTimesheet(c.env.DB, {
    id: ulid(), orgId, userId, date: data.date,
    clockIn: data.clockIn, clockOut: data.clockOut, hours, notes: data.notes,
  });
  return isApi(c) ? c.json({ ok: true }) : c.redirect('/portal/hr/timesheets');
});

timesheets.post('/:id/approve', requirePermission(PERMISSIONS.APPROVE_TIMESHEET), csrfMiddleware, zValidator('form', ApproveTimesheetSchema), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const { status } = c.req.valid('form');
  await updateTimesheetStatus(c.env.DB, c.req.param('id'), orgId, status, userId);
  await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: `${status}_timesheet`, module: 'hr', entityId: c.req.param('id') });
  return c.redirect('/portal/hr/timesheets');
});

export default timesheets;
