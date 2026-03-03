/**
 * ULID generator using Web Crypto API (Workers-compatible, no Node.js deps).
 * ULIDs are lexicographically sortable, URL-safe, 26-char uppercase strings.
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(now: number, len: number): string {
  let str = '';
  for (let i = len; i > 0; i--) {
    str = ENCODING[now % ENCODING_LEN] + str;
    now = Math.floor(now / ENCODING_LEN);
  }
  return str;
}

function encodeRandom(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let str = '';
  for (let i = 0; i < len; i++) {
    str += ENCODING[bytes[i] % ENCODING_LEN];
  }
  return str;
}

/**
 * Generate a ULID string. Uses Web Crypto API — compatible with Cloudflare Workers.
 */
export function ulid(): string {
  const now = Date.now();
  return encodeTime(now, TIME_LEN) + encodeRandom(RANDOM_LEN);
}

/**
 * Generate a standard UUID v4 (for JTI / CSRF tokens).
 */
export function uuid(): string {
  return crypto.randomUUID();
}
