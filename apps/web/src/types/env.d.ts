/// <reference types="@cloudflare/workers-types" />
export interface Env {
  // Cloudflare bindings
  DB:     D1Database;
  R2:     R2Bucket;
  KV:     KVNamespace;
  ASSETS: Fetcher;
  EMAIL?: { send: (msg: any) => Promise<void> };

  // Secrets (set via wrangler secret put)
  JWT_SECRET:      string;
  JWT_SECRET_PREV: string; // previous secret for zero-downtime rotation
  RESEND_API_KEY:  string;
  CF_API_TOKEN:    string; // Custom Hostnames:Edit permission

  // Vars (set in wrangler.toml [env.*.vars])
  ENVIRONMENT:  'local' | 'staging' | 'production';
  APP_URL:      string;  // https://eqbis.com or https://staging.eqbis.com
  R2_PUBLIC:    string;  // https://cdn.eqbis.com
  CF_ZONE_ID:   string;  // Cloudflare zone ID for eqbis.com
}

import type { JWTPayload } from './jwt.js';

export interface HonoEnv {
  Bindings: Env;
  Variables: {
    user?:      JWTPayload;
    orgId?:     string;
    orgSlug?:   string;
    tenantId?:  string;  // D1 DB ID for the tenant
    tenantSlug?: string; // e.g. "acme"
  };
}
