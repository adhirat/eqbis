/**
 * Security headers middleware.
 * Applied globally to all HTML responses.
 * API responses get a minimal subset (CORS is handled separately).
 */

import type { MiddlewareHandler } from 'hono';

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();

  // Only add to HTML responses
  const ct = c.res.headers.get('Content-Type') ?? '';
  if (!ct.includes('text/html')) return;

  c.res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' cdn.jsdelivr.net 'unsafe-inline'",  // Alpine.js from CDN; inline for x-data
      "style-src 'self' fonts.googleapis.com 'unsafe-inline'",
      "font-src 'self' fonts.gstatic.com",
      `img-src 'self' data: *.r2.cloudflarestorage.com`,
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );

  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );
  c.res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
};
