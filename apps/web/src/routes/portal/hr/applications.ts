import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requirePermission } from '../../../middleware/rbac.js';
import { csrfMiddleware } from '../../../middleware/csrf.js';
import { ulid } from '../../../lib/id.js';
import { getApplications, updateApplicationStatus } from '../../../db/queries/hr.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const applications = new Hono<HonoEnv>();

applications.get('/', requirePermission(PERMISSIONS.VIEW_APPLICATIONS), async (c) => {
  const { orgId } = c.get('user');
  const rows = await getApplications(c.env.DB, orgId);
  if (isApi(c)) return c.json({ applications: rows });

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Applications — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <h2 class="text-lg font-bold text-[var(--text)]">Job Applications</h2>
  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>${['Applicant','Email','Position','Status','Date','Actions'].map(h => `<th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">${h}</th>`).join('')}</tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${rows.map(a => `<tr>
          <td class="px-4 py-2.5 text-[var(--text)] font-medium">${a.applicant_name}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${a.email}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${a.career_title ?? '—'}</td>
          <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-[11px] font-medium ${a.status === 'hired' ? 'bg-green-500/15 text-green-400' : a.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}">${a.status}</span></td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${new Date(a.created_at * 1000).toLocaleDateString()}</td>
          <td class="px-4 py-2.5">
            <select onchange="if(this.value){fetch('/portal/hr/applications/${a.id}/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:this.value})}).then(()=>location.reload())}" class="h-7 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs">
              <option value="">Change...</option>
              ${['reviewing','shortlisted','rejected','hired'].map(s => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div></body></html>`);
});

applications.post('/:id/status', requirePermission(PERMISSIONS.MANAGE_APPLICATIONS), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const { status } = await c.req.json() as { status: string };
  await updateApplicationStatus(c.env.DB, c.req.param('id'), orgId, status);
  await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: `updated_application_status`, module: 'hr', entityId: c.req.param('id'), details: { status } });
  return c.json({ ok: true });
});

export default applications;
