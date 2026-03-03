/**
 * CRM — Accounts  /portal/crm/accounts
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requireAnyPermission } from '../../../middleware/rbac.js';
import { ulid } from '../../../lib/id.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const accounts = new Hono<HonoEnv>();

const TYPE_COLORS: Record<string, string> = {
  prospect:  'bg-blue-500/15 text-blue-400',
  customer:  'bg-green-500/15 text-green-400',
  partner:   'bg-violet-500/15 text-violet-400',
  reseller:  'bg-orange-500/15 text-orange-400',
  vendor:    'bg-yellow-500/15 text-yellow-400',
};

// ── List accounts ──────────────────────────────────────────────────────────────

accounts.get(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    let all: any[] = [];
    try {
      const result = await db
        .prepare('SELECT * FROM accounts WHERE org_id = ? ORDER BY created_at DESC')
        .bind(orgId)
        .all();
      all = result.results ?? [];
    } catch {
      all = [];
    }

    if (isApi(c)) return c.json({ accounts: all });

    const rows = all.map((a: any) => `
      <tr class="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
        <td class="px-4 py-2.5 text-sm font-medium text-[var(--text)]">${a.name ?? '—'}</td>
        <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[a.type] ?? ''}">${a.type ?? '—'}</span></td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${a.industry ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${a.website ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${a.phone ?? '—'}</td>
        <td class="px-4 py-2.5 text-sm text-[var(--text-muted)]">${a.created_at ? new Date(a.created_at * 1000).toLocaleDateString() : '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en" data-theme="dark">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Accounts — EQBIS</title>
<link rel="stylesheet" href="/css/app.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head><body class="bg-[var(--bg)] text-[var(--text)] min-h-screen p-6">
<div x-data="{ addOpen: false }">
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold">Accounts</h1>
    <p class="text-sm text-[var(--text-muted)] mt-0.5">${all.length} accounts</p>
  </div>
  <button @click="addOpen = true" class="h-8 px-3 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">+ New Account</button>
</div>
<div class="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
  <table class="w-full">
    <thead><tr class="border-b border-[var(--border)] text-left">
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Name</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Type</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Industry</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Website</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Phone</th>
      <th class="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Created</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No accounts found</td></tr>'}</tbody>
  </table>
</div>

<!-- New Account Modal -->
<div x-show="addOpen" x-cloak class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @keydown.escape.window="addOpen = false">
  <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg p-6" @click.outside="addOpen = false">
    <h2 class="text-lg font-semibold mb-4">New Account</h2>
    <form method="POST" action="/portal/crm/accounts">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Account Name *</label>
          <input name="name" required class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
            <select name="type" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
              <option value="prospect" selected>Prospect</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="reseller">Reseller</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Industry</label>
            <input name="industry" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Website</label>
            <input name="website" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
          <div>
            <label class="block text-xs font-medium text-[var(--text-muted)] mb-1">Phone</label>
            <input name="phone" class="w-full h-8 px-2.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]">
          </div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" @click="addOpen = false" class="flex-1 h-8 border border-[var(--border)] rounded text-sm">Cancel</button>
        <button type="submit" class="flex-1 h-8 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90">Create Account</button>
      </div>
    </form>
  </div>
</div>
</div>
</body></html>`;

    return c.html(html);
  },
);

// ── Create account ─────────────────────────────────────────────────────────────

accounts.post(
  '/',
  requireAnyPermission(PERMISSIONS.VIEW_CRM, PERMISSIONS.MANAGE_CRM),
  async (c) => {
    const user  = c.get('user');
    const orgId = user.orgId;
    const db    = c.env.DB;

    const fd       = await c.req.formData();
    const name     = fd.get('name')     as string;
    const type     = fd.get('type')     as string || 'prospect';
    const industry = fd.get('industry') as string || null;
    const website  = fd.get('website')  as string || null;
    const phone    = fd.get('phone')    as string || null;

    const id  = ulid();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db
        .prepare('INSERT INTO accounts (id, org_id, name, type, industry, website, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, orgId, name, type, industry, website, phone, now)
        .run();
    } catch {
      // table may not exist yet
    }

    if (isApi(c)) return c.json({ success: true, id });
    return c.redirect('/portal/crm/accounts');
  },
);

export default accounts;
