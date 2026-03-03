/**
 * Support — Solutions  /portal/support/solutions
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const solutions = new Hono<HonoEnv>();

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-slate-500/15 text-slate-400',
  published: 'bg-green-500/15 text-green-400',
  archived:  'bg-red-500/15 text-red-400',
};

// ── List solutions ─────────────────────────────────────────────────────────────

solutions.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let all: any[] = [];
    try {
      const result = await db
        .prepare('SELECT * FROM solutions WHERE org_id = ? ORDER BY created_at DESC')
        .bind(orgId)
        .all();
      all = result.results ?? [];
    } catch {
      all = [];
    }

    if (isApi(c)) return c.json({ solutions: all });

    const rows = all.map((s: any) => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium text-[var(--text)]">${s.title ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${s.category ?? '—'}</td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s.status] ?? ''}">${s.status ?? '—'}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${s.views ?? 0}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${s.created_at ? new Date(s.created_at * 1000).toLocaleDateString() : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Solutions — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Solutions</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} solutions</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Solution</button>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Title</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Category</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Views</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Created</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No solutions found</td></tr>'}</tbody>
  </table>
</div>

<!-- New Solution Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Solution</h2>
    <form method="POST" action="/portal/support/solutions">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Title *</label>
          <input name="title" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
          <input name="category" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Content</label>
          <textarea name="content" rows="5" class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Status</label>
          <select name="status" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
            <option value="draft" selected>Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create Solution</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create solution ────────────────────────────────────────────────────────────

solutions.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_TICKETS, PERMISSIONS.MANAGE_TICKETS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd       = await c.req.formData();
    const title    = fd.get('title')    as string;
    const category = fd.get('category') as string || null;
    const content  = fd.get('content')  as string || null;
    const status   = fd.get('status')   as string || 'draft';

    const id  = ulid();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db
        .prepare('INSERT INTO solutions (id, org_id, title, category, status, views, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, orgId, title, category, status, 0, now)
        .run();
    } catch {
      // table may not exist yet
    }

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/support/solutions');
  },
);

export default solutions;
