import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requirePermission } from '../../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../../middleware/csrf.js';
import { ulid } from '../../../lib/id.js';
import { LeaveRequestSchema, ApproveLeaveSchema } from '../../../lib/schemas.js';
import { getLeaves, createLeave, updateLeaveStatus } from '../../../db/queries/hr.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const leaves = new Hono<HonoEnv>();

leaves.get('/', requirePermission(PERMISSIONS.VIEW_TIMESHEET), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const isAdmin = new Set(c.get('user').permissions).has(PERMISSIONS.APPROVE_TIMESHEET);
  const rows = await getLeaves(c.env.DB, orgId, isAdmin ? {} : { userId });
  if (isApi(c)) return c.json({ leaves: rows });

  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Leaves — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-[var(--text)]">Leave Requests</h2>
    <button onclick="document.getElementById('leave-modal').classList.remove('hidden')"
      class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium">+ Request Leave</button>
  </div>
  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>
          ${(isAdmin ? ['Employee','Type','From','To','Days','Status','Actions'] : ['Type','From','To','Days','Status']).map(h =>
            `<th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${rows.map(l => `<tr>
          ${isAdmin ? `<td class="px-4 py-2.5 text-[var(--text)]">${l.user_name ?? '—'}</td>` : ''}
          <td class="px-4 py-2.5 text-[var(--text)] capitalize">${l.type.replace('_', ' ')}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${l.start_date}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${l.end_date}</td>
          <td class="px-4 py-2.5 text-[var(--text)]">${l.days ?? '—'}</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium ${l.status === 'approved' ? 'bg-green-500/15 text-green-400' : l.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}">${l.status}</span>
          </td>
          ${isAdmin && l.status === 'pending' ? `
          <td class="px-4 py-2.5 flex gap-2">
            <form method="POST" action="/portal/hr/leaves/${l.id}/approve"><input type="hidden" name="_csrf" value="${csrf}"><input type="hidden" name="status" value="approved"><button class="text-xs text-green-400 hover:underline">Approve</button></form>
            <form method="POST" action="/portal/hr/leaves/${l.id}/approve"><input type="hidden" name="_csrf" value="${csrf}"><input type="hidden" name="status" value="rejected"><button class="text-xs text-red-400 hover:underline">Reject</button></form>
          </td>` : isAdmin ? '<td></td>' : ''}
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div id="leave-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/60" onclick="document.getElementById('leave-modal').classList.add('hidden')"></div>
    <div class="relative z-10 w-full max-w-md mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      <h3 class="font-semibold text-[var(--text)]">Request Leave</h3>
      <form method="POST" action="/portal/hr/leaves" class="space-y-4">
        <input type="hidden" name="_csrf" value="${csrf}">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
          <select name="type" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
            <option value="annual">Annual Leave</option><option value="sick">Sick Leave</option>
            <option value="personal">Personal</option><option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">From</label><input name="startDate" type="date" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>
          <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">To</label><input name="endDate" type="date" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>
        </div>
        <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Reason</label><textarea name="reason" rows="2" class="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></textarea></div>
        <div class="flex gap-2">
          <button type="button" onclick="document.getElementById('leave-modal').classList.add('hidden')" class="flex-1 h-9 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button type="submit" class="flex-1 h-9 rounded bg-[var(--accent)] text-white font-medium text-sm">Submit</button>
        </div>
      </form>
    </div>
  </div>
</div></body></html>`);
});

leaves.post('/', requirePermission(PERMISSIONS.VIEW_TIMESHEET), csrfMiddleware, zValidator('form', LeaveRequestSchema), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const data = c.req.valid('form');
  const d1 = new Date(data.startDate); const d2 = new Date(data.endDate);
  const days = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1);
  await createLeave(c.env.DB, { id: ulid(), orgId, userId, type: data.type, startDate: data.startDate, endDate: data.endDate, days, reason: data.reason });
  return isApi(c) ? c.json({ ok: true }) : c.redirect('/portal/hr/leaves');
});

leaves.post('/:id/approve', requirePermission(PERMISSIONS.APPROVE_TIMESHEET), csrfMiddleware, zValidator('form', ApproveLeaveSchema), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const { status, notes } = c.req.valid('form');
  await updateLeaveStatus(c.env.DB, c.req.param('id'), orgId, status, userId, notes);
  await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: `${status}_leave`, module: 'hr', entityId: c.req.param('id') });
  return c.redirect('/portal/hr/leaves');
});

export default leaves;
