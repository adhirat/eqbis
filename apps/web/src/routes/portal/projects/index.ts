/**
 * Projects module — /portal/projects
 * Includes milestones and comments as sub-routes on the detail page.
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import {
  getProjects, getProjectById, createProject, updateProject,
  getMilestones, createMilestone, getComments, createComment,
} from '../../../db/queries/crm.js';
import { getClients } from '../../../db/queries/crm.js';
import { logActivity } from '../../../db/queries/orgs.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const projects = new Hono<HonoEnv>();

const STATUS_COLORS: Record<string, string> = {
  planning:  'bg-blue-500/15 text-blue-400',
  active:    'bg-green-500/15 text-green-400',
  on_hold:   'bg-yellow-500/15 text-yellow-400',
  completed: 'bg-purple-500/15 text-purple-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

const MILESTONE_COLORS: Record<string, string> = {
  pending:     'bg-yellow-500/15 text-yellow-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  completed:   'bg-green-500/15 text-green-400',
};

// ── List projects ──────────────────────────────────────────────────────────────

projects.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const status = c.req.query('status');

    const [all, clientList] = await Promise.all([
      getProjects(db, orgId, status ?? undefined),
      getClients(db, orgId, 'active'),
    ]);

    if (isApi(c)) return c.json({ projects: all });

    const statusValues = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

    const filterLinks = statusValues.map(s =>
      `<a href="/portal/projects?status=${s}"
         class="px-3 py-1.5 rounded text-sm ${status === s ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">${s.replace('_', ' ')}</a>`
    ).join('');

    const clientOptions = clientList.map(cl =>
      `<option value="${cl.id}">${cl.name}</option>`
    ).join('');

    const rows = all.map(p => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5">
          <a href="/portal/projects/${p.id}" class="text-sm font-medium text-[var(--accent)] hover:underline">${p.name}</a>
        </td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${(p as any).client_name ?? '—'}</td>
        <td class="px-4 py-2.5">
          <span class="px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status] ?? ''}">${p.status.replace('_', ' ')}</span>
        </td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.start_date ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.end_date ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${p.budget ? '$' + p.budget.toLocaleString() : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>Projects — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Projects</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} projects</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Project</button>
</div>

<div class="flex gap-2 mb-4 flex-wrap">
  <a href="/portal/projects" class="px-3 py-1.5 rounded text-sm ${!status ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}">All</a>
  ${filterLinks}
</div>

<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Project</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Client</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Start</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">End</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase">Budget</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No projects yet</td></tr>'}</tbody>
  </table>
</div>

<!-- New Project Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Project</h2>
    <form method="POST" action="/portal/projects">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Project Name *</label>
          <input name="name" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Client</label>
            <select name="clientId" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
              <option value="">— None —</option>
              ${clientOptions}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Status</label>
            <select name="status" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Start Date</label>
            <input name="startDate" type="date" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">End Date</label>
            <input name="endDate" type="date" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Budget</label>
          <input name="budget" type="number" step="0.01" min="0" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
          <textarea name="description" rows="3" class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create Project</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create project ─────────────────────────────────────────────────────────────

projects.post(
  '/',
  requireAnyPermission(PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd = await c.req.formData();
    const name        = fd.get('name')        as string;
    const clientId    = fd.get('clientId')    as string || undefined;
    const status      = fd.get('status')      as string || 'planning';
    const startDate   = fd.get('startDate')   as string || undefined;
    const endDate     = fd.get('endDate')     as string || undefined;
    const budget      = fd.get('budget')      ? parseFloat(fd.get('budget') as string) : undefined;
    const description = fd.get('description') as string || undefined;

    const id = ulid();
    await createProject(db, { id, orgId, clientId, name, status, startDate, endDate, budget, description, createdBy: user.sub });
    await logActivity(db, orgId, user.sub, 'create', 'projects', `Created project: ${name}`);

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect(`/portal/projects/${id}`);
  },
);

// ── Project detail ─────────────────────────────────────────────────────────────

projects.get(
  '/:id',
  requireAnyPermission(PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const [project, milestones, comments] = await Promise.all([
      getProjectById(db, id, orgId),
      getMilestones(db, id, orgId),
      getComments(db, id, orgId),
    ]);

    if (!project) return c.notFound();
    if (isApi(c)) return c.json({ project, milestones, comments });

    const msRows = milestones.map(m => `
      <div class="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
        <div class="flex items-center gap-3">
          <form method="POST" action="/portal/projects/${id}/milestones/${m.id}/status">
            <button name="status" value="${m.status === 'completed' ? 'pending' : 'completed'}"
              class="w-4 h-4 rounded border ${m.status === 'completed' ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'} flex items-center justify-center text-white text-xs">${m.status === 'completed' ? '✓' : ''}</button>
          </form>
          <span class="text-sm ${m.status === 'completed' ? 'line-through text-[var(--text-muted)]' : ''}">${m.title}</span>
        </div>
        <div class="flex items-center gap-3">
          ${m.due_date ? `<span class="text-xs text-[var(--text-muted)]">${m.due_date}</span>` : ''}
          <span class="px-2 py-0.5 rounded text-xs ${MILESTONE_COLORS[m.status] ?? ''}">${m.status.replace('_', ' ')}</span>
        </div>
      </div>`).join('');

    const commentItems = comments.map(cm => `
      <div class="py-3 border-b border-[var(--border)] last:border-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-medium">${cm.user_name ?? 'Unknown'}</span>
          <span class="text-xs text-[var(--text-muted)]">${new Date(cm.created_at * 1000).toLocaleString()}</span>
        </div>
        <p class="text-sm">${cm.content}</p>
      </div>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><title>${project.name} — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ msOpen: false }">
<a href="/portal/projects" class="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4 inline-block">← Back to Projects</a>

<div class="flex items-start justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">${project.name}</h1>
    <span class="px-2 py-0.5 rounded text-xs font-medium mt-1 inline-block ${STATUS_COLORS[project.status] ?? ''}">${project.status.replace('_', ' ')}</span>
  </div>
  <form method="POST" action="/portal/projects/${project.id}/status">
    <select name="status" onchange="this.form.submit()"
      class="h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded">
      ${['planning','active','on_hold','completed','cancelled'].map(s =>
        `<option value="${s}" ${project.status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
      ).join('')}
    </select>
  </form>
</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
    ${project.start_date ? `<div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">Start</span><span>${project.start_date}</span></div>` : ''}
    ${project.end_date ? `<div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">End</span><span>${project.end_date}</span></div>` : ''}
    ${project.budget ? `<div class="flex justify-between text-sm"><span class="text-[var(--text-muted)]">Budget</span><span>$${project.budget.toLocaleString()}</span></div>` : ''}
  </div>
  ${project.description ? `
  <div class="md:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
    <p class="text-sm">${project.description}</p>
  </div>` : ''}
</div>

<!-- Milestones -->
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden mb-6">
  <div class="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
    <h2 class="text-sm font-semibold">Milestones (${milestones.length})</h2>
    <button @click="msOpen = true" class="text-xs text-[var(--accent)] hover:underline">+ Add</button>
  </div>
  <div class="px-4">${msRows || '<p class="py-6 text-center text-sm text-[var(--text-muted)]">No milestones</p>'}</div>
</div>

<!-- Comments -->
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <div class="px-4 py-3 border-b border-[var(--border)]">
    <h2 class="text-sm font-semibold">Comments (${comments.length})</h2>
  </div>
  <div class="px-4">${commentItems || '<p class="py-4 text-center text-sm text-[var(--text-muted)]">No comments yet</p>'}</div>
  <form method="POST" action="/portal/projects/${project.id}/comments" class="px-4 pb-4 pt-2 border-t border-[var(--border)]">
    <textarea name="content" required rows="2" placeholder="Write a comment..."
      class="w-full px-2.5 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] resize-none mb-2"></textarea>
    <button type="submit" class="h-7 px-3 bg-[var(--accent)] text-white rounded text-xs font-medium hover:opacity-90">Post</button>
  </form>
</div>

<!-- Add Milestone Modal -->
<div x-show="msOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="msOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-sm p-5" @click.outside="msOpen = false">
    <h2 class="text-base font-semibold mb-3">Add Milestone</h2>
    <form method="POST" action="/portal/projects/${project.id}/milestones">
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Title *</label>
          <input name="title" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Due Date</label>
          <input name="dueDate" type="date" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
      </div>
      <div class="flex gap-3 mt-4">
        <button type="button" @click="msOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Add</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Update project status ──────────────────────────────────────────────────────

projects.post(
  '/:id/status',
  requireAnyPermission(PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;
    const id    = c.req.param('id');

    const fd = await c.req.formData();
    const status = fd.get('status') as string;

    await updateProject(db, id, orgId, { status });
    await logActivity(db, orgId, user.sub, 'update', 'projects', `Updated project status: ${status}`);

    if (isApi(c)) return c.json({ success: true });
    return c.redirect(`/portal/projects/${id}`);
  },
);

// ── Add milestone ──────────────────────────────────────────────────────────────

projects.post(
  '/:id/milestones',
  requireAnyPermission(PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user      = c.get('user');
    const orgId     = user.orgId;
    const db        = c.env.DB;
    const projectId = c.req.param('id');

    const fd      = await c.req.formData();
    const title   = fd.get('title')   as string;
    const dueDate = fd.get('dueDate') as string || undefined;

    const id = ulid();
    await createMilestone(db, { id, orgId, projectId, title, dueDate });

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect(`/portal/projects/${projectId}`);
  },
);

// ── Update milestone status ────────────────────────────────────────────────────

projects.post(
  '/:id/milestones/:msId/status',
  requireAnyPermission(PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user      = c.get('user');
    const orgId     = user.orgId;
    const db        = c.env.DB;
    const projectId = c.req.param('id');
    const msId      = c.req.param('msId');

    const fd     = await c.req.formData();
    const status = fd.get('status') as string;

    await db.prepare('UPDATE project_milestones SET status = ?, updated_at = unixepoch() WHERE id = ? AND org_id = ?')
      .bind(status, msId, orgId).run();

    if (isApi(c)) return c.json({ success: true });
    return c.redirect(`/portal/projects/${projectId}`);
  },
);

// ── Add comment ────────────────────────────────────────────────────────────────

projects.post(
  '/:id/comments',
  requireAnyPermission(PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.MANAGE_PROJECTS),
  async (c) => {
    const user      = c.get('user');
    const orgId     = user.orgId;
    const db        = c.env.DB;
    const projectId = c.req.param('id');

    const fd      = await c.req.formData();
    const content = fd.get('content') as string;

    const id = ulid();
    await createComment(db, { id, orgId, projectId, userId: user.sub, content });

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect(`/portal/projects/${projectId}`);
  },
);

export default projects;
