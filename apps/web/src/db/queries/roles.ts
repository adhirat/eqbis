/**
 * Role DB queries.
 */

export interface RoleRow {
  id:          string;
  org_id:      string | null;
  name:        string;
  description: string | null;
  color:       string;
  is_default:  number;
  created_at:  number;
  // joined
  permissions?: string[];
  member_count?: number;
}

/** Get all roles visible to an org (global defaults + org-specific). */
export async function getOrgRoles(db: D1Database, orgId: string): Promise<RoleRow[]> {
  const rows = await db
    .prepare(
      `SELECT r.*, COUNT(DISTINCT ur.user_id) AS member_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id AND ur.org_id = ?
       WHERE r.org_id IS NULL OR r.org_id = ?
       GROUP BY r.id
       ORDER BY r.is_default DESC, r.name ASC`,
    )
    .bind(orgId, orgId)
    .all<RoleRow>();
  return rows.results;
}

export async function getRoleById(db: D1Database, roleId: string): Promise<RoleRow | null> {
  return db.prepare('SELECT * FROM roles WHERE id = ? LIMIT 1').bind(roleId).first<RoleRow>();
}

/** Get all permissions for a role. */
export async function getRolePermissions(db: D1Database, roleId: string): Promise<string[]> {
  const rows = await db
    .prepare('SELECT permission FROM role_permissions WHERE role_id = ?')
    .bind(roleId)
    .all<{ permission: string }>();
  return rows.results.map(r => r.permission);
}

export async function createRole(
  db: D1Database,
  role: { id: string; orgId: string; name: string; description?: string; color: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO roles (id, org_id, name, description, color) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(role.id, role.orgId, role.name, role.description ?? null, role.color)
    .run();
}

export async function updateRole(
  db: D1Database,
  roleId: string,
  fields: Partial<{ name: string; description: string; color: string }>,
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length === 0) return;
  sets.push('updated_at = unixepoch()');
  vals.push(roleId);

  await db.prepare(`UPDATE roles SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
}

export async function deleteRole(db: D1Database, roleId: string): Promise<void> {
  await db.prepare('DELETE FROM roles WHERE id = ? AND is_default = 0').bind(roleId).run();
}

/** Replace all permissions for a role (used on role edit). */
export async function setRolePermissions(
  db: D1Database,
  roleId: string,
  permissions: string[],
): Promise<void> {
  await db.prepare('DELETE FROM role_permissions WHERE role_id = ?').bind(roleId).run();

  if (permissions.length === 0) return;

  const placeholders = permissions.map(() => '(?, ?)').join(', ');
  const vals = permissions.flatMap(p => [roleId, p]);
  await db
    .prepare(`INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES ${placeholders}`)
    .bind(...vals)
    .run();
}

/** Assign a role to a user in an org (removes previous role assignment first). */
export async function assignRoleToUser(
  db: D1Database,
  opts: { userId: string; orgId: string; roleId: string },
): Promise<void> {
  // For simplicity, replace all roles for this user+org with the new one
  await db
    .prepare('DELETE FROM user_roles WHERE user_id = ? AND org_id = ?')
    .bind(opts.userId, opts.orgId)
    .run();

  await db
    .prepare('INSERT INTO user_roles (user_id, org_id, role_id) VALUES (?, ?, ?)')
    .bind(opts.userId, opts.orgId, opts.roleId)
    .run();

  // Keep primary_role_id in sync on org_members
  await db
    .prepare('UPDATE org_members SET primary_role_id = ? WHERE user_id = ? AND org_id = ?')
    .bind(opts.roleId, opts.userId, opts.orgId)
    .run();
}
