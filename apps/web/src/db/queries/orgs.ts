/**
 * Organisation DB queries.
 */

export interface OrgRow {
  id:            string;
  name:          string;
  slug:          string;
  logo_key:      string | null;
  owner_id:      string | null;
  emp_id_prefix: string;
  timezone:      string;
  plan:          string;
  created_at:    number;
}

export async function getOrgById(db: D1Database, orgId: string): Promise<OrgRow | null> {
  return db
    .prepare('SELECT * FROM organizations WHERE id = ? LIMIT 1')
    .bind(orgId)
    .first<OrgRow>();
}

export async function getOrgBySlug(db: D1Database, slug: string): Promise<OrgRow | null> {
  return db
    .prepare('SELECT * FROM organizations WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<OrgRow>();
}

export async function createOrg(
  db: D1Database,
  org: { id: string; name: string; slug: string; emp_id_prefix: string; timezone?: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO organizations (id, name, slug, emp_id_prefix, timezone) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(org.id, org.name, org.slug, org.emp_id_prefix, org.timezone ?? 'UTC')
    .run();
}

export async function updateOrg(
  db: D1Database,
  orgId: string,
  fields: Partial<{ name: string; slug: string; logo_key: string; emp_id_prefix: string; timezone: string }>,
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
  }
  if (sets.length === 0) return;
  sets.push('updated_at = unixepoch()');
  vals.push(orgId);

  await db.prepare(`UPDATE organizations SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
}

export async function addMember(
  db: D1Database,
  opts: { id: string; orgId: string; userId: string; roleId: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT OR IGNORE INTO org_members (id, org_id, user_id, primary_role_id) VALUES (?, ?, ?, ?)',
    )
    .bind(opts.id, opts.orgId, opts.userId, opts.roleId)
    .run();

  await db
    .prepare('INSERT OR IGNORE INTO user_roles (user_id, org_id, role_id) VALUES (?, ?, ?)')
    .bind(opts.userId, opts.orgId, opts.roleId)
    .run();
}

export async function getUserOrgs(
  db: D1Database,
  userId: string,
): Promise<Array<{ org_id: string; name: string; slug: string; logo_key: string | null }>> {
  const rows = await db
    .prepare(
      `SELECT o.id AS org_id, o.name, o.slug, o.logo_key
       FROM org_members om
       JOIN organizations o ON o.id = om.org_id
       WHERE om.user_id = ?
       ORDER BY o.name ASC`,
    )
    .bind(userId)
    .all<{ org_id: string; name: string; slug: string; logo_key: string | null }>();
  return rows.results;
}

export async function getNextEmployeeId(
  db: D1Database,
  orgId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM employees WHERE org_id = ?`,
    )
    .bind(orgId)
    .first<{ cnt: number }>();
  return (row?.cnt ?? 0) + 1;
}

/** Positional helper — generates a unique ID automatically. */
export async function logActivity(
  db: D1Database,
  opts: {
    orgId: string;
    userId: string | null;
    action: string;
    module: string;
    details?: unknown;
    ip?: string;
    entityId?: string;
    id?: string;
  },
): Promise<void> {
  const id = opts.id || (Date.now().toString(36).toUpperCase().padStart(10, '0') +
    Math.random().toString(36).slice(2, 12).toUpperCase().padEnd(10, '0'));
  await db
    .prepare(
      `INSERT INTO activity_logs (id, org_id, user_id, action, module, details, ip, entity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      opts.orgId,
      opts.userId,
      opts.action,
      opts.module,
      opts.details ? JSON.stringify(opts.details) : null,
      opts.ip ?? null,
      opts.entityId ?? null,
    )
    .run();
}

export async function getActivityLogs(
  db: D1Database,
  orgId: string,
  limit = 50,
): Promise<Array<{ id: string; action: string; module: string; user_name: string | null; created_at: number }>> {
  const rows = await db
    .prepare(
      `SELECT al.id, al.action, al.module, al.entity_id, al.created_at,
              u.full_name AS user_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.org_id = ?
       ORDER BY al.created_at DESC
       LIMIT ?`,
    )
    .bind(orgId, limit)
    .all<{ id: string; action: string; module: string; user_name: string | null; created_at: number }>();
  return rows.results;
}

export async function getOrgSettings(
  db: D1Database,
  orgId: string,
): Promise<Record<string, string>> {
  const rows = await db
    .prepare('SELECT key, value FROM org_settings WHERE org_id = ?')
    .bind(orgId)
    .all<{ key: string; value: string }>();
  return Object.fromEntries(rows.results.map(r => [r.key, r.value]));
}

export async function setOrgSetting(
  db: D1Database,
  orgId: string,
  key: string,
  value: string,
): Promise<void> {
  await db
    .prepare('INSERT OR REPLACE INTO org_settings (org_id, key, value) VALUES (?, ?, ?)')
    .bind(orgId, key, value)
    .run();
}
