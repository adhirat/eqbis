import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requirePermission } from '../../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../../middleware/csrf.js';
import { ulid } from '../../../lib/id.js';
import { CreateCareerSchema } from '../../../lib/schemas.js';
import { getCareers, createCareer } from '../../../db/queries/hr.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const careers = new Hono<HonoEnv>();

careers.get('/', requirePermission(PERMISSIONS.VIEW_APPLICATIONS), async (c) => {
  const { orgId } = c.get('user');
  const rows = await getCareers(c.env.DB, orgId, false);
  if (isApi(c)) return c.json({ careers: rows });

  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Careers — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-[var(--text)]">Careers / Job Postings</h2>
    <button onclick="document.getElementById('career-modal').classList.remove('hidden')" class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium">+ Post Job</button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    ${rows.map(j => `
    <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-[var(--text)]">${j.title}</h3>
          <p class="text-xs text-[var(--text-muted)]">${j.department ?? ''} · ${j.type.replace('_', ' ')} ${j.location ? '· ' + j.location : ''}</p>
        </div>
        <span class="text-[11px] px-2 py-0.5 rounded font-medium ${j.is_active ? 'bg-green-500/15 text-green-400' : 'bg-[var(--border)] text-[var(--text-muted)]'}">${j.is_active ? 'Active' : 'Closed'}</span>
      </div>
    </div>`).join('')}
  </div>

  <div id="career-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/60" onclick="document.getElementById('career-modal').classList.add('hidden')"></div>
    <div class="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <h3 class="font-semibold text-[var(--text)]">Post New Job</h3>
      <form method="POST" action="/portal/hr/careers" class="space-y-4">
        <input type="hidden" name="_csrf" value="${csrf}">
        ${[['title','Job Title','text'],['department','Department','text'],['location','Location','text']].map(([n,l,t]) => `
        <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">${l}</label>
        <input name="${n}" type="${t}" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></div>`).join('')}
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
          <select name="type" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
            <option value="full_time">Full Time</option><option value="part_time">Part Time</option>
            <option value="contract">Contract</option><option value="internship">Internship</option>
          </select>
        </div>
        <div><label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
        <textarea name="description" rows="4" required class="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm"></textarea></div>
        <div class="flex gap-2">
          <button type="button" onclick="document.getElementById('career-modal').classList.add('hidden')" class="flex-1 h-9 rounded border border-[var(--border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button type="submit" class="flex-1 h-9 rounded bg-[var(--accent)] text-white font-medium text-sm">Post</button>
        </div>
      </form>
    </div>
  </div>
</div></body></html>`);
});

careers.post('/', requirePermission(PERMISSIONS.MANAGE_APPLICATIONS), csrfMiddleware, zValidator('form', CreateCareerSchema), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const data = c.req.valid('form');
  const id = ulid();
  await createCareer(c.env.DB, { id, orgId, title: data.title, department: data.department, type: data.type, location: data.location, description: data.description });
  await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'created_career', module: 'hr', entityId: id });
  return isApi(c) ? c.json({ id }) : c.redirect('/portal/hr/careers');
});

export default careers;
