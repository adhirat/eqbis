/**
 * EQBIS — Cloudflare Worker entry point.
 * Registers all routers and serves static assets.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/env.js';

// Route modules
import authRouter    from './routes/auth.js';
import portalRouter  from './routes/portal/index.js';
import apiV1Router   from './routes/api/v1/index.js';

// Views
import { renderHomePage } from './views/marketing/home.js';

type HonoEnv = { Bindings: Env };

const app = new Hono<HonoEnv>();

// ── Global middleware ──────────────────────────────────────────────────────────

app.use('*', logger());

// CORS — allow mobile app + same-origin browser
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      // Allow same-origin, mobile apps (no origin), and configured APP_URL
      if (!origin || origin === 'null') return origin;
      return origin; // Tighten in production with allowlist
    },
    allowHeaders:  ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    allowMethods:  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials:   true,
    maxAge:        86400,
  }),
);

// ── Static assets ──────────────────────────────────────────────────────────────

// Serve files from public/ directory via ASSETS binding
app.get('/css/*',    async (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/js/*',     async (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/images/*', async (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/fonts/*',  async (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/favicon.ico', (c) => c.redirect('/images/logo.png'));

// ── Marketing routes ───────────────────────────────────────────────────────────

app.get('/', (c) => {
  const contactSuccess = c.req.query('contact') === 'success';
  return c.html(renderHomePage(contactSuccess, c.env.APP_URL));
});

app.get('/about',   (c) => c.redirect('/#features'));
app.get('/pricing', (c) => c.redirect('/#pricing'));
app.get('/contact', (c) => c.redirect('/#contact'));

// ── Auth routes  (/auth/*) ─────────────────────────────────────────────────────

app.route('/auth', authRouter);

// ── API v1 auth mirror  (/api/v1/auth/*) ──────────────────────────────────────
// Flutter mobile app calls /api/v1/auth/login, /api/v1/auth/register, etc.
// Reuse the same authRouter — it already returns JSON when Accept header is set.

app.route('/api/v1/auth', authRouter);

// ── Portal routes  (/portal/*) ────────────────────────────────────────────────

app.route('/portal', portalRouter);

// ── API v1 routes  (/api/v1/*) ────────────────────────────────────────────────

app.route('/api/v1', apiV1Router);

// ── Public webhook endpoints ───────────────────────────────────────────────────

// Cloudflare for SaaS hostname activation webhook
// Handled inside organization.ts but exposed here for external CF POST
app.post('/webhooks/cf-hostname', async (c) => {
  // Forward to organization route handler
  const url = new URL(c.req.url);
  url.pathname = '/portal/organization/webhooks/cf-hostname';
  return fetch(url.toString(), {
    method: 'POST',
    headers: c.req.raw.headers,
    body:    c.req.raw.body,
  });
});

// ── Public contact form endpoint ───────────────────────────────────────────────

app.post('/contact', async (c) => {
  const { createMessage } = await import('./db/queries/tickets.js');
  const { ulid }          = await import('./lib/id.js');

  try {
    const fd = await c.req.formData();
    const orgId  = c.req.query('org') ?? 'default';
    const name    = fd.get('name')    as string;
    const email   = fd.get('email')   as string;
    const phone   = fd.get('phone')   as string || undefined;
    const company = fd.get('company') as string || undefined;
    const service = fd.get('service') as string || undefined;
    const message = fd.get('message') as string;

    if (!name || !email || !message) {
      return c.json({ error: 'name, email, and message are required' }, 400);
    }

    const id = ulid();
    await createMessage(c.env.DB, { id, orgId, name, email, phone, company, service, message, source: 'web' });

    // Redirect back with success
    const referer = c.req.header('Referer') ?? '/';
    return c.redirect(referer + (referer.includes('?') ? '&' : '?') + 'contact=success');
  } catch (err) {
    console.error('Contact form error:', err);
    return c.json({ error: 'Failed to submit message' }, 500);
  }
});

// ── 404 ────────────────────────────────────────────────────────────────────────

app.notFound((c) => {
  const isApi = c.req.path.startsWith('/api/');
  if (isApi) return c.json({ error: 'Not found' }, 404);

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>404 — EQBIS</title>
<link rel="icon" type="image/png" href="/images/logo.png">
<link rel="apple-touch-icon" href="/images/logo.png">
<meta property="og:type" content="website">
<meta property="og:title" content="404 — EQBIS">
<meta property="og:image" content="${c.env.APP_URL}/images/logo.png">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/css/app.css">
</head>
<body class="bg-[var(--bg)] text-[var(--text)] min-h-screen flex items-center justify-center">
  <div class="text-center">
    <p class="text-6xl font-bold text-[var(--text-muted)] mb-4">404</p>
    <p class="text-lg mb-6">Page not found</p>
    <a href="/" class="text-[var(--accent)] hover:underline">← Back to home</a>
  </div>
</body></html>`, 404);
});

// ── Error handler ──────────────────────────────────────────────────────────────

app.onError((err, c) => {
  const isApi = c.req.path.startsWith('/api/');
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  const status  = (err as any).status ?? 500;
  const message = status < 500 ? err.message : 'Internal server error';

  if (isApi) return c.json({ error: message }, status);

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>Error — EQBIS</title>
<link rel="icon" type="image/png" href="/images/logo.png">
<link rel="apple-touch-icon" href="/images/logo.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Error — EQBIS">
<meta property="og:image" content="${c.env.APP_URL}/images/logo.png">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/css/app.css">
</head>
<body class="bg-[var(--bg)] text-[var(--text)] min-h-screen flex items-center justify-center">
  <div class="text-center">
    <p class="text-6xl font-bold text-[var(--text-muted)] mb-4">${status}</p>
    <p class="text-lg mb-6">${message}</p>
    <a href="/" class="text-[var(--accent)] hover:underline">← Back to home</a>
  </div>
</body></html>`, status);
});

// ── Export ─────────────────────────────────────────────────────────────────────

export default app;
