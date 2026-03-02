/**
 * Dual-mode response helper.
 * Same route handler can serve HTML (browser) or JSON (mobile / API client)
 * based on the request path prefix and Accept header.
 */

import type { Context } from 'hono';

/** Returns true if the request wants a JSON response. */
export function isApi(c: Context): boolean {
  return (
    c.req.path.startsWith('/api/') ||
    (c.req.header('Accept') ?? '').includes('application/json')
  );
}

/**
 * Respond with either JSON or rendered HTML depending on the client type.
 *
 * @param c      Hono context
 * @param data   The data object to serialise as JSON OR pass to the renderer
 * @param render A function that takes `data` and returns an HTML string
 */
export function dualRespond<T>(
  c: Context,
  data: T,
  render: (d: T) => string,
): Response {
  if (isApi(c)) {
    return c.json(data) as unknown as Response;
  }
  return c.html(render(data)) as unknown as Response;
}
