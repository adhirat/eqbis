export interface Env {
  // Cloudflare bindings
  DB:     D1Database;
  R2:     R2Bucket;
  KV:     KVNamespace;
  ASSETS: Fetcher;

  // Secrets (set via wrangler secret put)
  JWT_SECRET:      string;
  JWT_SECRET_PREV: string; // previous secret for zero-downtime rotation
  RESEND_API_KEY:  string;
  CF_API_TOKEN:    string; // Custom Hostnames:Edit permission

  // Vars (set in wrangler.toml [env.*.vars])
  ENVIRONMENT:  'staging' | 'production';
  APP_URL:      string;  // https://eqbis.com or https://staging.eqbis.com
  R2_PUBLIC:    string;  // https://cdn.eqbis.com
  CF_ZONE_ID:   string;  // Cloudflare zone ID for eqbis.com
}
