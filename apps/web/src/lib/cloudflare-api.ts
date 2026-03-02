/**
 * Cloudflare API helpers for the "Cloudflare for SaaS" Custom Hostnames feature.
 * Docs: https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/
 */

export interface CustomHostnameResult {
  id:                    string;   // Cloudflare cf_hostname_id (UUID)
  hostname:              string;
  status:                string;   // pending | active | deleted | ...
  ssl:                   { status: string };
  ownership_verification?: {
    name:  string;   // TXT record name
    value: string;   // TXT record value
    type:  string;   // 'txt'
  };
  ownership_verification_http?: {
    http_url:  string;
    http_body: string;
  };
}

interface CFResponse<T> {
  success: boolean;
  result:  T;
  errors:  { code: number; message: string }[];
}

/** Register a new custom hostname with Cloudflare (auto-provisions DV SSL cert). */
export async function createCustomHostname(
  domain:    string,
  env: { CF_ZONE_ID: string; CF_API_TOKEN: string },
): Promise<CustomHostnameResult> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/custom_hostnames`,
    {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostname: domain,
        ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
      }),
    },
  );

  const data: CFResponse<CustomHostnameResult> = await res.json();
  if (!data.success) {
    throw new Error(`CF API error: ${data.errors.map(e => e.message).join(', ')}`);
  }
  return data.result;
}

/** Fetch the current status of a custom hostname (poll for SSL activation). */
export async function getCustomHostname(
  cfHostnameId: string,
  env: { CF_ZONE_ID: string; CF_API_TOKEN: string },
): Promise<CustomHostnameResult> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/custom_hostnames/${cfHostnameId}`,
    { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } },
  );

  const data: CFResponse<CustomHostnameResult> = await res.json();
  if (!data.success) {
    throw new Error(`CF API error: ${data.errors.map(e => e.message).join(', ')}`);
  }
  return data.result;
}

/** Delete a custom hostname from Cloudflare (when tenant removes their domain). */
export async function deleteCustomHostname(
  cfHostnameId: string,
  env: { CF_ZONE_ID: string; CF_API_TOKEN: string },
): Promise<void> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/custom_hostnames/${cfHostnameId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
    },
  );

  const data: CFResponse<{ id: string }> = await res.json();
  if (!data.success) {
    throw new Error(`CF API error: ${data.errors.map(e => e.message).join(', ')}`);
  }
}
