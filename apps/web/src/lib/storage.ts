// Cloudflare R2 storage via native Workers binding
// The R2 bucket is bound as `R2` in wrangler.toml and
// accessed through getRequestContext() from @cloudflare/next-on-pages.
//
// For local dev (next dev), bindings are emulated via setupDevPlatform()
// in next.config.ts — no real R2 credentials needed.

import { getRequestContext } from "@cloudflare/next-on-pages";

function getBucket(): R2Bucket {
  const { env } = getRequestContext();
  return (env as { R2: R2Bucket }).R2;
}

/**
 * Upload a file to R2 and return its key path.
 * @param key  Storage path, e.g. "orgs/acme/avatars/user-123.png"
 * @param body File contents as ArrayBuffer or ReadableStream
 * @param contentType  MIME type, e.g. "image/png"
 */
export async function uploadFile(
  key: string,
  body: ArrayBuffer | ReadableStream,
  contentType: string
): Promise<string> {
  await getBucket().put(key, body, {
    httpMetadata: { contentType },
  });
  return key;
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(key: string): Promise<void> {
  await getBucket().delete(key);
}

/**
 * Get a temporary public URL for a private object.
 * R2 bindings don't support presigned URLs directly — use the public
 * bucket domain if the bucket is exposed publicly, or a Worker-side
 * signed URL via the S3-compat API for private buckets.
 */
export async function getFileUrl(key: string): Promise<string> {
  const domain = process.env.CF_R2_PUBLIC_DOMAIN;
  if (!domain) {
    throw new Error(
      "CF_R2_PUBLIC_DOMAIN env var is required to generate public R2 URLs"
    );
  }
  return `https://${domain}/${key}`;
}

/**
 * Stream / download a file directly (useful for server-side proxying).
 */
export async function getFile(key: string): Promise<R2ObjectBody | null> {
  return getBucket().get(key);
}
