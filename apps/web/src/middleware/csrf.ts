/**
 * CSRF protection — Double Submit Cookie pattern.
 *
 * On GET (form render): generate a random token, store in KV (TTL 1h),
 *   inject as hidden `<input name="_csrf">` in the form via the helper below.
 * On POST/PUT/DELETE: compare the submitted `_csrf` field against KV. Mismatch → 403.
 *
 * API routes (`/api/*`) are exempt — they use Bearer tokens (not cookies).
 */

import type { Context, MiddlewareHandler } from 'hono';
import { uuid } from '../lib/id.js';
import type { Env } from '../types/env.js';

const CSRF_TTL = 3600; // 1 hour

/** Store a new CSRF token in KV and return it. */
export async function generateCsrfToken(c: Context<{ Bindings: Env }>): Promise<string> {
  const token = uuid();
  await c.env.KV.put(`csrf:${token}`, '1', { expirationTtl: CSRF_TTL });
  return token;
}

/** HTML snippet for embedding CSRF token in forms. */
export function csrfField(token: string): string {
  return `<input type="hidden" name="_csrf" value="${token}">`;
}

/**
 * Middleware: verify CSRF token on state-changing methods.
 * Skip for API routes — those use Bearer tokens.
 */
export const csrfMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const method = c.req.method.toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const isApi = c.req.path.startsWith('/api/');

  if (!isStateChanging || isApi) {
    return next();
  }

  const contentType = c.req.header('Content-Type') ?? '';
  let csrfToken: string | null = null;

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const body = await c.req.parseBody();
    csrfToken = (body['_csrf'] as string) ?? null;
  } else if (contentType.includes('application/json')) {
    // JSON requests from the portal JS should include X-CSRF-Token header
    csrfToken = c.req.header('X-CSRF-Token') ?? null;
  }

  if (!csrfToken) {
    return c.json({ error: 'Missing CSRF token' }, 403);
  }

  const valid = await c.env.KV.get(`csrf:${csrfToken}`);
  if (!valid) {
    return c.json({ error: 'Invalid or expired CSRF token' }, 403);
  }

  // Consume the token (one-time use)
  await c.env.KV.delete(`csrf:${csrfToken}`);

  await next();
};
