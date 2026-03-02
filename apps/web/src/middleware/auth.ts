/**
 * Authentication middleware.
 * Reads the `auth_token` cookie (browser) or `Authorization: Bearer` header (mobile/API).
 * Verifies the JWT and stores the payload in the Hono context as `user`.
 * Redirects to /auth/login on failure (HTML requests) or returns 401 JSON (API requests).
 */

import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyTokenWithFallback } from '../lib/jwt.js';
import type { JWTPayload } from '../types/jwt.js';
import type { Env } from '../types/env.js';

export type AuthVariables = {
  user: JWTPayload;
};

function isApiRequest(c: Context): boolean {
  return (
    c.req.path.startsWith('/api/') ||
    (c.req.header('Accept') ?? '').includes('application/json')
  );
}

/** Extract raw token string from cookie or Authorization header. */
function extractToken(c: Context): string | null {
  const cookie = getCookie(c, 'auth_token');
  if (cookie) return cookie;

  const auth = c.req.header('Authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  return null;
}

/**
 * Require a valid JWT on the request.
 * Sets `c.get('user')` to the JWTPayload on success.
 */
export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> =
  async (c, next) => {
    const token = extractToken(c);

    if (!token) {
      return isApiRequest(c)
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.redirect('/auth/login');
    }

    try {
      const env = c.env as Env;
      const payload = await verifyTokenWithFallback(
        token,
        env.JWT_SECRET,
        env.JWT_SECRET_PREV,
      );

      // Check KV for revoked JTI (logout / token rotation)
      const revoked = await env.KV.get(`revoked:${payload.jti}`);
      if (revoked) {
        return isApiRequest(c)
          ? c.json({ error: 'Token revoked' }, 401)
          : c.redirect('/auth/login');
      }

      c.set('user', payload);
      await next();
    } catch {
      return isApiRequest(c)
        ? c.json({ error: 'Invalid or expired token' }, 401)
        : c.redirect('/auth/login');
    }
  };

/**
 * Optional auth — sets `user` if a valid token is present, but does NOT block the request.
 * Useful for marketing pages that show different content when logged in.
 */
export const optionalAuth: MiddlewareHandler<{ Bindings: Env; Variables: Partial<AuthVariables> }> =
  async (c, next) => {
    const token = extractToken(c);
    if (token) {
      try {
        const env = c.env as Env;
        const payload = await verifyTokenWithFallback(token, env.JWT_SECRET, env.JWT_SECRET_PREV);
        const revoked = await env.KV.get(`revoked:${payload.jti}`);
        if (!revoked) c.set('user', payload);
      } catch {
        // Ignore — token is invalid or expired; proceed as unauthenticated
      }
    }
    await next();
  };
