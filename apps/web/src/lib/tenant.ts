import { headers } from "next/headers";

/**
 * Resolves the current tenant slug from the x-tenant-slug header
 * set by middleware during subdomain routing.
 */
export async function getTenantSlug(): Promise<string | null> {
  const headerStore = await headers();
  return headerStore.get("x-tenant-slug");
}

/**
 * Returns true if the request is coming from the main app subdomain
 * or the marketing site (not a tenant subdomain).
 */
export async function isMainApp(): Promise<boolean> {
  const slug = await getTenantSlug();
  return slug === null;
}
