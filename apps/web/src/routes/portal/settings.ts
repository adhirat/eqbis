import { Hono } from 'hono';
import type { Env } from '../../types/env.js';
import type { AuthVariables } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import { requirePermission } from '../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../middleware/csrf.js';
import { getOrgSettings, setOrgSetting } from '../../db/queries/orgs.js';
import { isApi } from '../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const settings = new Hono<HonoEnv>();

settings.get('/', requirePermission(PERMISSIONS.VIEW_SETTINGS), async (c) => {
  const { orgId } = c.get('user');
  const s = await getOrgSettings(c.env.DB, orgId);
  if (isApi(c)) return c.json({ settings: s });

  const csrf = await generateCsrfToken(c);
  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Settings — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6 max-w-lg">
  <h2 class="text-lg font-bold text-[var(--text)]">Portal Settings</h2>
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
    <form method="POST" action="/portal/settings" class="space-y-4">
      <input type="hidden" name="_csrf" value="${csrf}">
      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Default Currency</label>
        <select name="currency" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
          ${['USD','EUR','GBP','INR','AUD','CAD'].map(cur =>
            `<option value="${cur}" ${s.currency === cur ? 'selected' : ''}>${cur}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Date Format</label>
        <select name="dateFormat" class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
          <option value="MM/DD/YYYY" ${s.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
          <option value="DD/MM/YYYY" ${s.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
          <option value="YYYY-MM-DD" ${s.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
        </select>
      </div>
      <button type="submit" class="h-9 px-6 rounded bg-[var(--accent)] text-white font-medium text-sm">Save</button>
    </form>
  </div>
</div></body></html>`);
});

settings.post('/', requirePermission(PERMISSIONS.MANAGE_SETTINGS), csrfMiddleware, async (c) => {
  const { orgId } = c.get('user');
  const body = await c.req.parseBody();
  for (const [key, value] of Object.entries(body)) {
    if (key !== '_csrf' && typeof value === 'string') {
      await setOrgSetting(c.env.DB, orgId, key, value);
    }
  }
  return isApi(c) ? c.json({ ok: true }) : c.redirect('/portal/settings?saved=1');
});

export default settings;
