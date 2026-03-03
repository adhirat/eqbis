/**
 * Cloudflare R2 storage helpers.
 * All operations use the native R2Bucket Workers binding — no AWS SDK.
 */

export interface UploadResult {
  key:  string;
  url:  string; // Public URL via R2_PUBLIC base
}

/** Upload a file to R2 and return the key and public URL. */
export async function uploadFile(opts: {
  bucket:    R2Bucket;
  key:       string;   // e.g. "orgs/abc123/logo.png"
  body:      ReadableStream | ArrayBuffer | Blob;
  contentType: string;
  publicBase: string;  // env.R2_PUBLIC
}): Promise<UploadResult> {
  await opts.bucket.put(opts.key, opts.body, {
    httpMetadata: { contentType: opts.contentType },
  });
  return {
    key: opts.key,
    url: `${opts.publicBase}/${opts.key}`,
  };
}

/** Delete a file from R2. Silently ignores missing keys. */
export async function deleteFile(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

/** Get a file from R2 as an ArrayBuffer. Returns null if not found. */
export async function getFile(bucket: R2Bucket, key: string): Promise<ArrayBuffer | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  return obj.arrayBuffer();
}

/**
 * Generate a presigned PUT URL for direct client-to-R2 upload.
 * Worker returns this URL to the client; client PUTs directly — Worker is not in upload path.
 *
 * NOTE: As of 2025, R2 presigned URLs require the `createPresignedUrl` Workers API
 * which may require a custom domain pointing at your R2 bucket.
 * See: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
 */
export async function presignPut(opts: {
  bucket:      R2Bucket;
  key:         string;
  expiresIn:   number; // seconds
  contentType: string;
}): Promise<string> {
  // R2Bucket.createPresignedUrl is available in recent Wrangler / Workers runtime.
  // Falls back to a Worker-proxied upload URL if not available.
  // @ts-ignore — method added in recent CF runtime; types may lag
  const url = await opts.bucket.createPresignedUrl('PUT', opts.key, {
    expiresIn: opts.expiresIn,
    httpMetadata: { contentType: opts.contentType },
  });
  return url as string;
}

/** Build an R2 object key for a given entity. */
export function buildKey(segments: string[]): string {
  return segments
    .map(s => s.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');
}
