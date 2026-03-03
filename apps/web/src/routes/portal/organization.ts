/**
 * Organisation settings routes — /portal/organization
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../../types/env.js';
import type { AuthVariables } from '../../middleware/auth.js';
import { PERMISSIONS } from '../../lib/permissions.js';
import { requirePermission } from '../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../middleware/csrf.js';
import { ulid } from '../../lib/id.js';
import { UpdateOrgSchema, AddDomainSchema } from '../../lib/schemas.js';
import { getOrgById, updateOrg, logActivity, getOrgSettings, setOrgSetting } from '../../db/queries/orgs.js';
import { createCustomHostname, getCustomHostname } from '../../lib/cloudflare-api.js';
import { isApi } from '../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const organization = new Hono<HonoEnv>();

organization.get('/', requirePermission(PERMISSIONS.MANAGE_ORGANIZATION), async (c) => {
  const { orgId } = c.get('user');
  const [org, settings] = await Promise.all([
    getOrgById(c.env.DB, orgId),
    getOrgSettings(c.env.DB, orgId),
  ]);
  if (!org) return c.json({ error: 'Not found' }, 404);
  if (isApi(c)) return c.json({ org, settings });

  const customDomains = await c.env.DB
    .prepare('SELECT * FROM custom_domains WHERE org_id = ? ORDER BY created_at DESC')
    .bind(orgId).all();

  const csrf = await generateCsrfToken(c);

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Organisation — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6 max-w-2xl">
  <h2 class="text-lg font-bold text-[var(--text)]">Organisation Settings</h2>

  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
    <h3 class="font-semibold text-[var(--text)]">General</h3>
    <form method="POST" action="/portal/organization" class="space-y-4">
      <input type="hidden" name="_csrf" value="${csrf}">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Name</label>
          <input name="name" type="text" value="${org.name}" required
            class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Employee ID Prefix</label>
          <input name="empIdPrefix" type="text" value="${org.emp_id_prefix}"
            class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Timezone</label>
          <input name="timezone" type="text" value="${org.timezone}"
            class="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
        </div>
      </div>
      <button type="submit" class="h-9 px-6 rounded bg-[var(--accent)] text-white font-medium text-sm">Save</button>
    </form>
  </div>

  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
    <h3 class="font-semibold text-[var(--text)]">Custom Domains</h3>
    <p class="text-xs text-[var(--text-muted)]">Map your own domain to your EQBIS portal. Requires adding DNS records to your domain.</p>
    ${customDomains.results.map((d: any) => `
    <div class="flex items-center gap-3 py-2 border-t border-[var(--border)]">
      <div class="flex-1">
        <p class="text-sm font-medium text-[var(--text)]">${d.domain}</p>
        <p class="text-xs text-[var(--text-muted)]">SSL: ${d.ssl_status} · Status: ${d.status}</p>
      </div>
    </div>`).join('')}
    <form method="POST" action="/portal/organization/domains" class="flex gap-2">
      <input type="hidden" name="_csrf" value="${csrf}">
      <input name="domain" type="text" placeholder="portal.yourcompany.com"
        class="flex-1 h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm">
      <button type="submit" class="h-9 px-4 rounded bg-[var(--accent)] text-white text-sm font-medium">Add Domain</button>
    </form>
  </div>
</div></body></html>`);
});

organization.post(
  '/',
  requirePermission(PERMISSIONS.MANAGE_ORGANIZATION),
  csrfMiddleware,
  zValidator('form', UpdateOrgSchema),
  async (c) => {
    const { orgId, sub: userId } = c.get('user');
    const data = c.req.valid('form');
    await updateOrg(c.env.DB, orgId, {
      name: data.name, timezone: data.timezone, emp_id_prefix: data.empIdPrefix,
    });
    await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'updated_org', module: 'org' });
    return isApi(c) ? c.json({ ok: true }) : c.redirect('/portal/organization?saved=1');
  },
);

// Add custom domain
organization.post(
  '/domains',
  requirePermission(PERMISSIONS.MANAGE_ORGANIZATION),
  csrfMiddleware,
  zValidator('form', AddDomainSchema),
  async (c) => {
    const { orgId, sub: userId } = c.get('user');
    const { domain } = c.req.valid('form');

    try {
      const result = await createCustomHostname(domain, c.env);
      await c.env.DB
        .prepare(
          'INSERT INTO custom_domains (id, org_id, domain, cf_hostname_id, status) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(ulid(), orgId, domain, result.id, 'pending')
        .run();

      await logActivity(c.env.DB, { id: ulid(), orgId, userId, action: 'added_custom_domain', module: 'org', details: { domain } });
    } catch (e) {
      console.error('Failed to add custom domain:', e);
    }

    return c.redirect('/portal/organization?domain_added=1');
  },
);

// Webhook from Cloudflare for hostname status updates
organization.post('/webhooks/cf-hostname', async (c) => {
  const body = await c.req.json() as any;
  const { hostname, ssl: { status: sslStatus }, status } = body;

  await c.env.DB
    .prepare(
      'UPDATE custom_domains SET status = ?, ssl_status = ?, verified_at = unixepoch() WHERE domain = ?',
    )
    .bind(
      status === 'active' ? 'active' : status,
      sslStatus === 'active' ? 'active' : sslStatus,
      hostname,
    )
    .run();

  // Invalidate KV cache for this domain
  await c.env.KV.delete(`domain:${hostname}`);

  return c.json({ ok: true });
});

export default organization;
