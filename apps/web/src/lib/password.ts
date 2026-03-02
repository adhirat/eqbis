/**
 * Password hashing using Web Crypto PBKDF2 (Workers-native, zero deps).
 *
 * Format:  pbkdf2$iterations$salt(hex)$hash(hex)
 * Example: pbkdf2$310000$a1b2c3...$d4e5f6...
 *
 * PBKDF2-SHA256 with 310,000 iterations matches OWASP 2024 minimum guidance.
 * Using PBKDF2 instead of bcrypt because Workers does not have bcrypt WASM
 * readily available as a maintained ESM module; Web Crypto PBKDF2 is native.
 */

const ITERATIONS = 310_000;
const KEY_LEN    = 32; // 256-bit output
const ALG        = 'SHA-256';

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(h: string): Uint8Array {
  const arr = new Uint8Array(h.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

/** Hash a plaintext password. Returns a storable string. */
export async function hashPassword(password: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = hex(saltBytes.buffer as ArrayBuffer);

  const enc  = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: ALG, salt: saltBytes, iterations: ITERATIONS },
    base,
    KEY_LEN * 8,
  );

  return `pbkdf2$${ITERATIONS}$${salt}$${hex(bits)}`;
}

/** Compare a plaintext password against a stored hash. Constant-time safe. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const [, iterStr, saltHex, hashHex] = parts;
  const iterations = parseInt(iterStr, 10);
  const salt = fromHex(saltHex);

  const enc  = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: ALG, salt, iterations },
    base,
    KEY_LEN * 8,
  );

  // Constant-time comparison via HMAC verify trick
  const candidate = hex(bits);
  if (candidate.length !== hashHex.length) return false;

  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return diff === 0;
}
