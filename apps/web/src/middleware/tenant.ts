/**
 * Tenant resolution middleware.
 * Determines the current org from the Host header:
 *   1. slug.eqbis.com  → look up by slug in D1
 *   2. portal.acme.com → look up in custom_domains, cache in KV (5-min TTL)
 *   3. eqbis.com / api.eqbis.com → no tenant context (marketing / admin)
 *
 * Sets `c.set('orgId', ...)` for downstream handlers.
 */

import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../types/env.js';

export type TenantVariables = {
  orgId: string | null;
};

const APEX        = 'eqbis.com';
const CACHE_TTL   = 300; // 5 minutes

/** Resolve the org ID from the Host header. Returns null for unknown / apex domains. */
export async function resolveTenantId(
  c: Context<{ Bindings: Env }>,
): Promise<string | null> {
  const host = (c.req.header('Host') ?? '').split(':')[0].toLowerCase();

  // Apex domain — no tenant
  if (host === APEX || host === `www.${APEX}` || host === `api.${APEX}`) {
    return null;
  }

  // Native subdomain: {slug}.eqbis.com
  if (host.endsWith(`.${APEX}`)) {
    const slug = host.slice(0, -(APEX.length + 1));
    const org = await c.env.DB
      .prepare('SELECT id FROM organizations WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first<{ id: string }>();
    return org?.id ?? null;
  }

  // Custom domain — check KV cache first
  const cacheKey = `domain:${host}`;
  const cached   = await c.env.KV.get(cacheKey);
  if (cached) return cached;

  // Look up in D1
  const row = await c.env.DB
    .prepare(
      'SELECT org_id FROM custom_domains WHERE domain = ? AND status = ? LIMIT 1',
    )
    .bind(host, 'active')
    .first<{ org_id: string }>();

  if (row) {
    await c.env.KV.put(cacheKey, row.org_id, { expirationTtl: CACHE_TTL });
    return row.org_id;
  }

  return null; // Unknown domain
}

/**
 * Middleware: resolve and set tenant org ID.
 * Does NOT block — sets `orgId` to null for marketing pages.
 */
export const tenantMiddleware: MiddlewareHandler<
  { Bindings: Env; Variables: TenantVariables }
> = async (c, next) => {
  const orgId = await resolveTenantId(c);
  c.set('orgId', orgId);
  await next();
};

/**
 * Middleware: require a resolved tenant. Returns 404 for unknown domains.
 * Apply this on portal routes.
 */
export const requireTenant: MiddlewareHandler<
  { Bindings: Env; Variables: TenantVariables }
> = async (c, next) => {
  const orgId = c.get('orgId') ?? await resolveTenantId(c);
  if (!orgId) {
    return c.json({ error: 'Unknown tenant' }, 404);
  }
  c.set('orgId', orgId);
  await next();
};
