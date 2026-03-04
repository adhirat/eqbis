/**
 * User DB queries — always scoped to an org via org_members join.
 */

import type { Env } from '../../types/env.js';

export interface UserRow {
  id:         string;
  email:      string;
  full_name:  string;
  photo_key:  string | null;
  is_active:  number;
  is_verified: number; // NEW
  created_at: number;
  password_hash?: string;
  // joined from org_members / user_roles
  role_id?:   string;
  role_name?: string;
  role_color?: string;
}

export async function getOrgUsers(db: D1Database, orgId: string): Promise<UserRow[]> {
  const rows = await db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.photo_key, u.is_active, u.created_at,
              r.id AS role_id, r.name AS role_name, r.color AS role_color
       FROM users u
       JOIN org_members om ON om.user_id = u.id AND om.org_id = ?
       LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.org_id = ?
       LEFT JOIN roles r ON r.id = ur.role_id
       ORDER BY u.full_name ASC`,
    )
    .bind(orgId, orgId)
    .all<UserRow>();
  return rows.results;
}

export async function getUserById(db: D1Database, userId: string, orgId?: string): Promise<UserRow | null> {
  if (orgId) {
    return db
      .prepare(`
        SELECT u.* FROM users u
        JOIN org_members om ON om.user_id = u.id AND om.org_id = ?
        WHERE u.id = ? LIMIT 1
      `)
      .bind(orgId, userId)
      .first<UserRow>();
  }
  return db
    .prepare('SELECT * FROM users WHERE id = ? LIMIT 1')
    .bind(userId)
    .first<UserRow>();
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT * FROM users WHERE email = ? LIMIT 1')
    .bind(email.toLowerCase().trim())
    .first<UserRow>();
}

export async function createUser(
  db: D1Database,
  user: { id: string; email: string; full_name: string; password_hash: string },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO users (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)',
    )
    .bind(user.id, user.email.toLowerCase().trim(), user.full_name, user.password_hash)
    .run();
}

export async function updateUser(
  db: D1Database,
  userId: string,
  fields: Partial<{ full_name: string; photo_key: string; is_active: number }>,
  orgId?: string,
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (fields.full_name !== undefined)  { sets.push('full_name = ?');  vals.push(fields.full_name); }
  if (fields.photo_key !== undefined)  { sets.push('photo_key = ?');  vals.push(fields.photo_key); }
  if (fields.is_active !== undefined)  { sets.push('is_active = ?');  vals.push(fields.is_active); }

  if (sets.length === 0) return;
  sets.push('updated_at = unixepoch()');

  if (orgId) {
    await db
      .prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ? AND id IN (SELECT user_id FROM org_members WHERE org_id = ?)`)
      .bind(...vals, userId, orgId)
      .run();
  } else {
    await db
      .prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...vals, userId)
      .run();
  }
}

export async function updatePassword(
  db: D1Database,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db
    .prepare('UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?')
    .bind(passwordHash, userId)
    .run();
}

export async function verifyUser(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare('UPDATE users SET is_verified = 1, updated_at = unixepoch() WHERE id = ?')
    .bind(userId)
    .run();
}

export async function getUserPermissions(
  db: D1Database,
  userId: string,
  orgId: string,
): Promise<string[]> {
  const rows = await db
    .prepare(
      `SELECT DISTINCT rp.permission
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       WHERE ur.user_id = ? AND ur.org_id = ?`,
    )
    .bind(userId, orgId)
    .all<{ permission: string }>();
  return rows.results.map(r => r.permission);
}

export async function getUserRoleIds(
  db: D1Database,
  userId: string,
  orgId: string,
): Promise<string[]> {
  const rows = await db
    .prepare('SELECT role_id FROM user_roles WHERE user_id = ? AND org_id = ?')
    .bind(userId, orgId)
    .all<{ role_id: string }>();
  return rows.results.map(r => r.role_id);
}
