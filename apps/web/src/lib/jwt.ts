/**
 * HS256 JWT — sign and verify using Web Crypto API (Workers-native, zero deps).
 */

import type { JWTPayload } from '../types/jwt.js';

const ALG = { name: 'HMAC', hash: 'SHA-256' };

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), ALG, false, ['sign', 'verify']);
}

function base64url(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

/** Sign a JWTPayload and return a compact JWT string. */
export async function signToken(payload: JWTPayload, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader  = base64url(enc.encode(JSON.stringify(header)).buffer as ArrayBuffer);
  const encodedPayload = base64url(enc.encode(JSON.stringify(payload)).buffer as ArrayBuffer);
  const signingInput   = `${encodedHeader}.${encodedPayload}`;

  const key = await importKey(secret);
  const sig  = await crypto.subtle.sign(ALG, key, enc.encode(signingInput));

  return `${signingInput}.${base64url(sig)}`;
}

/** Verify a JWT string. Returns the payload or throws on invalid/expired. */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const enc = new TextEncoder();

  const key = await importKey(secret);
  const sigBytes = base64urlDecode(encodedSig);
  const valid = await crypto.subtle.verify(ALG, key, sigBytes, enc.encode(signingInput));
  if (!valid) throw new Error('Invalid JWT signature');

  const payload: JWTPayload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload)));

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }

  return payload;
}

/**
 * Verify against current secret, fall back to JWT_SECRET_PREV for zero-downtime rotation.
 * Returns the payload and the secret that successfully verified it.
 */
export async function verifyTokenWithFallback(
  token: string,
  current: string,
  prev?: string,
): Promise<JWTPayload> {
  try {
    return await verifyToken(token, current);
  } catch {
    if (prev) {
      return await verifyToken(token, prev);
    }
    throw new Error('Invalid or expired token');
  }
}

/** Build a JWTPayload with correct iat/exp/jti. */
export function buildPayload(
  partial: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>,
): JWTPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    ...partial,
    iat: now,
    exp: now + 604800, // 7 days
    jti: crypto.randomUUID(),
  };
}
