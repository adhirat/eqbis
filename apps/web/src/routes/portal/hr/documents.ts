import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import { PERMISSIONS } from '../../../lib/permissions.js';
import { requirePermission } from '../../../middleware/rbac.js';
import { csrfMiddleware, generateCsrfToken } from '../../../middleware/csrf.js';
import { ulid } from '../../../lib/id.js';
import { PresignSchema, PresignConfirmSchema } from '../../../lib/schemas.js';
import { zValidator } from '@hono/zod-validator';
import { getHrDocuments, createHrDocument } from '../../../db/queries/hr.js';
import { presignPut, buildKey } from '../../../lib/storage.js';
import { isApi } from '../../../middleware/respond.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const documents = new Hono<HonoEnv>();

documents.get('/', requirePermission(PERMISSIONS.VIEW_DOCUMENTS), async (c) => {
  const { orgId } = c.get('user');
  const rows = await getHrDocuments(c.env.DB, orgId);
  if (isApi(c)) return c.json({ documents: rows });

  return c.html(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><title>Documents — EQBIS</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="min-h-screen bg-[var(--bg)]"><div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-[var(--text)]">HR Documents</h2>
  </div>
  <div class="overflow-x-auto rounded-lg border border-[var(--border)]">
    <table class="w-full text-sm">
      <thead class="border-b border-[var(--border)]">
        <tr>${['Title','Type','Uploaded By','Date','Actions'].map(h => `<th class="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">${h}</th>`).join('')}</tr>
      </thead>
      <tbody class="divide-y divide-[var(--border)]">
        ${rows.map(d => `<tr>
          <td class="px-4 py-2.5 text-[var(--text)] font-medium">${d.title}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)] capitalize">${d.type}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${d.user_name ?? '—'}</td>
          <td class="px-4 py-2.5 text-[var(--text-muted)]">${new Date(d.created_at * 1000).toLocaleDateString()}</td>
          <td class="px-4 py-2.5"><a href="${c.env.R2_PUBLIC}/${d.file_key}" target="_blank" class="text-xs text-[var(--accent)] hover:underline">Download</a></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div></body></html>`);
});

// Presign upload URL — client uploads directly to R2
documents.post('/presign', requirePermission(PERMISSIONS.CREATE_DOCUMENT), zValidator('json', PresignSchema), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const { filename, contentType } = c.req.valid('json');
  const key = buildKey(['orgs', orgId, 'documents', ulid(), filename]);
  const url = await presignPut({ bucket: c.env.R2, key, expiresIn: 300, contentType });
  return c.json({ url, key });
});

// Confirm after successful R2 upload
documents.post('/confirm', requirePermission(PERMISSIONS.CREATE_DOCUMENT), zValidator('json', PresignConfirmSchema), async (c) => {
  const { orgId, sub: userId } = c.get('user');
  const { key } = c.req.valid('json');
  const body = await c.req.json() as any;
  await createHrDocument(c.env.DB, {
    id: ulid(), orgId, userId, title: body.title ?? key.split('/').pop() ?? 'Document',
    type: body.type ?? 'other', fileKey: key, fileName: key.split('/').pop() ?? key,
  });
  return c.json({ ok: true });
});

export default documents;
