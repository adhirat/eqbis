/**
 * KV-based sliding window rate limiter.
 * Stores a simple counter per key with a TTL matching the window size.
 * Suitable for low-throughput sensitive endpoints (auth, invite, reset-password).
 */

import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env.js';

interface RateLimitOptions {
  /** KV key prefix — e.g. 'rl:auth:login' */
  prefix:  string;
  /** Window size in seconds (default: 60) */
  window?: number;
  /** Max requests allowed in the window (default: 20) */
  limit?:  number;
  /** Key generator — defaults to client IP */
  keyFn?:  (c: Parameters<MiddlewareHandler>[0]) => string;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler<{ Bindings: Env }> {
  const window = opts.window ?? 60;
  const limit  = opts.limit  ?? 20;

  return async (c, next) => {
    if (!c.env.KV) {
      console.warn('[RateLimit] KV binding "KV" is missing. Rate limiting is disabled.');
      return next();
    }

    const ip  = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
    const key = `${opts.prefix}:${opts.keyFn ? opts.keyFn(c) : ip}`;

    let count = 0;
    try {
      const raw = await c.env.KV.get(key);
      count = raw ? parseInt(raw, 10) : 0;
    } catch (err) {
      console.error('[RateLimit] KV error:', err);
      return next(); // Fail open for rate limiting if KV is down
    }

    if (count >= limit) {
      console.info(`[RateLimit] Blocked ${key} (limit: ${limit})`);
      return c.json(
        { error: 'Too many requests. Please try again later.' },
        429,
        { 'Retry-After': String(window) },
      );
    }

    // Increment — set TTL on first request, extend on subsequent
    await c.env.KV.put(key, String(count + 1), { expirationTtl: Math.max(window, 60) });

    c.header('X-RateLimit-Limit',     String(limit));
    c.header('X-RateLimit-Remaining', String(Math.max(0, limit - count - 1)));

    await next();
  };
}
