import { Hono } from 'hono';
import type { Env } from '../../types/env.js';
import type { AuthVariables } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import { requirePermission } from '../../middleware/rbac.js';
import { getActivityLogs } from '../../db/queries/orgs.js';
import { isApi } from '../../middleware/respond.js';
import { formatDate } from '../../views/components.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const activity = new Hono<HonoEnv>();

activity.get('/', requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (c) => {
  const { orgId } = c.get('user');
  const logs = await getActivityLogs(c.env.DB, orgId, 100);
  if (isApi(c)) return c.json({ logs });

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Activity Log — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <h2 class="text-lg font-bold text-[var(--text)]">Activity Log</h2>
  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Action</th>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Module</th>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">User</th>
          <th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Date</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${logs.map(l => `
        <tr>
          <td class="px-4 py-2.5 text-[var(--text)]">${l.action.replace(/_/g, ' ')}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)] capitalize">${l.module}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${l.user_name ?? 'System'}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${formatDate(l.created_at)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div></body></html>`);
});

export default activity;
