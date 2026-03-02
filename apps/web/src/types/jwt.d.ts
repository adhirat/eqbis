export interface JWTPayload {
  sub:         string;       // user ULID
  email:       string;
  name:        string;
  orgId:       string;       // currently active org ULID
  orgSlug:     string;       // for subdomain validation (slug.eqbis.com)
  roles:       string[];     // role IDs for active org
  permissions: string[];     // flattened, pre-computed at login — no per-request DB call
  photo:       string | null;
  iat:         number;
  exp:         number;       // iat + 604800 (7 days)
  jti:         string;       // UUID for revocation via KV
}

export interface OrgMembership {
  orgId:   string;
  orgName: string;
  orgSlug: string;
  logo:    string | null;
}
