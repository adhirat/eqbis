/**
 * RBAC middleware factory.
 * Reads pre-computed permissions from the JWT payload (O(1) Set lookup per request, no DB call).
 * Returns 403 HTML or JSON depending on the Accept header / path prefix.
 */

import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../types/env.js';
import type { AuthVariables } from './auth.js';
import type { Permission } from '../lib/permissions.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

function isApiRequest(c: Context): boolean {
  return (
    c.req.path.startsWith('/api/') ||
    (c.req.header('Accept') ?? '').includes('application/json')
  );
}

function render403(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>403 Forbidden — EQBIS</title>
<link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen flex items-center justify-center bg-[var(--bg)]">
  <div class="text-center space-y-4">
    <p class="text-6xl font-bold text-[var(--accent)]">403</p>
    <h1 class="text-xl font-semibold text-[var(--text)]">Access Denied</h1>
    <p class="text-[var(--text-muted)]">You do not have permission to view this page.</p>
    <a href="/portal" class="inline-block mt-4 px-4 py-2 rounded bg-[var(--accent)] text-white text-sm">
      Back to Dashboard
    </a>
  </div>
</body></html>`;
}

/**
 * Require ALL of the listed permissions (AND logic).
 * Usage: `route.get('/users', requirePermission('view_users'), handler)`
 */
export function requirePermission(
  ...permissions: Permission[]
): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return isApiRequest(c)
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.redirect('/auth/login');
    }

    const userPerms = new Set(user.permissions);
    const hasAll = permissions.every(p => userPerms.has(p));

    if (!hasAll) {
      return isApiRequest(c)
        ? c.json({ error: 'Forbidden' }, 403)
        : c.html(render403(), 403);
    }

    await next();
  };
}

/**
 * Require ANY ONE of the listed permissions (OR logic).
 * Usage: `requireAnyPermission('view_admin_dashboard', 'view_employee_dashboard')`
 */
export function requireAnyPermission(
  ...permissions: Permission[]
): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return isApiRequest(c)
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.redirect('/auth/login');
    }

    const userPerms = new Set(user.permissions);
    const hasAny = permissions.some(p => userPerms.has(p));

    if (!hasAny) {
      return isApiRequest(c)
        ? c.json({ error: 'Forbidden' }, 403)
        : c.html(render403(), 403);
    }

    await next();
  };
}
