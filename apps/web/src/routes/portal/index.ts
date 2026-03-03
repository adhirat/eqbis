/**
 * Portal router — applies authMiddleware globally to all /portal/* routes.
 * Layout injection middleware wraps every GET HTML response with the
 * sidebar + header shell so individual route files only return inner content.
 */

import { Hono } from 'hono';
import type { Env } from '../../types/env.js';
import type { AuthVariables } from '../../middleware/auth.js';
import { authMiddleware } from '../../middleware/auth.js';
import { renderPortalPage } from '../../lib/portal-render.js';

import dashboardRouter   from './dashboard.js';
import usersRouter       from './users.js';
import rolesRouter       from './roles.js';
import orgRouter         from './organization.js';
import hrRouter          from './hr/index.js';
import financeRouter     from './finance/index.js';
import crmRouter         from './crm/index.js';
import activitiesRouter  from './activities/index.js';
import inventoryRouter   from './inventory/index.js';
import projectsRouter    from './projects/index.js';
import supportRouter     from './support/index.js';
import commsRouter       from './comms/index.js';
import activityRouter    from './activity.js';
import settingsRouter    from './settings.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const portal = new Hono<HonoEnv>();

// ── 1. Auth guard ──────────────────────────────────────────────────────────────
portal.use('*', authMiddleware);

// ── 2. Layout injection — wraps bare HTML pages in the shared Layout shell ────
//
// Route handlers return raw inner HTML (<!DOCTYPE html>…</html> pages without
// the sidebar). This middleware intercepts those responses and re-renders them
// inside the Layout component so the sidebar + header appear on every page.
// Pages that already use Layout (dashboard) are detected via the <aside> tag
// and skipped, preventing double-wrapping.
//
portal.use('*', async (c, next) => {
  await next();

  // Only process successful HTML GET responses
  if (c.req.method !== 'GET') return;
  const ct = c.res.headers.get('content-type') ?? '';
  if (!ct.includes('text/html')) return;
  if (c.res.status !== 200) return;

  const user = c.get('user');
  if (!user) return;

  // Clone before reading so c.res body stays intact for early returns
  const html = await c.res.clone().text();

  // Skip pages already wrapped in Layout (they contain <aside)
  if (html.includes('<aside')) return;

  // Extract <title> and <body> content from the raw HTML page
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const bodyMatch  = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return;

  const rawTitle = titleMatch ? titleMatch[1] : 'Portal';
  const title    = rawTitle.replace(/\s*[—-]\s*EQBIS\s*$/i, '').trim();
  const innerHtml = bodyMatch[1];

  const currentPath = new URL(c.req.url).pathname;
  const wrapped = renderPortalPage(user, currentPath, title, innerHtml, c.env.APP_URL);

  c.res = new Response(wrapped, {
    status:  200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
});

// ── 3. Sub-routers ────────────────────────────────────────────────────────────
portal.route('/',             dashboardRouter);
portal.route('/users',        usersRouter);
portal.route('/roles',        rolesRouter);
portal.route('/organization', orgRouter);
portal.route('/hr',           hrRouter);
portal.route('/finance',      financeRouter);
portal.route('/crm',          crmRouter);
portal.route('/activities',   activitiesRouter);
portal.route('/inventory',    inventoryRouter);
portal.route('/projects',     projectsRouter);
portal.route('/support',      supportRouter);
portal.route('/comms',        commsRouter);
portal.route('/activity',     activityRouter);
portal.route('/settings',     settingsRouter);

export default portal;
