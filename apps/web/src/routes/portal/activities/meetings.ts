/**
 * Activities — Meetings  /portal/activities/meetings
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const meetings = new Hono<HonoEnv>();

// ── List meetings ──────────────────────────────────────────────────────────────

meetings.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let all: any[] = [];
    try {
      const result = await db
        .prepare('SELECT * FROM meetings WHERE org_id = ? ORDER BY start_time DESC')
        .bind(orgId)
        .all();
      all = result.results ?? [];
    } catch {
      all = [];
    }

    if (isApi(c)) return c.json({ meetings: all });

    const fmt = (v: any) => {
      if (!v) return '—';
      try { return new Date(v).toLocaleString(); } catch { return v; }
    };

    const rows = all.map((m: any) => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium text-[var(--text)]">${m.title ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${m.host_name ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${fmt(m.start_time)}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${fmt(m.end_time)}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${m.location ?? '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Meetings — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Meetings</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} meetings</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Meeting</button>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Title</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Host</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Start</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">End</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Location</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No meetings found</td></tr>'}</tbody>
  </table>
</div>

<!-- New Meeting Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Meeting</h2>
    <form method="POST" action="/portal/activities/meetings">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Title *</label>
          <input name="title" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Start Time</label>
            <input name="start_time" type="datetime-local" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">End Time</label>
            <input name="end_time" type="datetime-local" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Location</label>
          <input name="location" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
          <textarea name="description" rows="3" class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Schedule Meeting</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create meeting ─────────────────────────────────────────────────────────────

meetings.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd          = await c.req.formData();
    const title       = fd.get('title')       as string;
    const start_time  = fd.get('start_time')  as string || null;
    const end_time    = fd.get('end_time')    as string || null;
    const location    = fd.get('location')    as string || null;
    const description = fd.get('description') as string || null;

    const id  = ulid();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db
        .prepare('INSERT INTO meetings (id, org_id, title, start_time, end_time, location, description, host_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, orgId, title, start_time, end_time, location, description, user.name ?? null, now)
        .run();
    } catch {
      // table may not exist yet
    }

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/activities/meetings');
  },
);

export default meetings;
