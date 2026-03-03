/** @jsxImportSource hono/jsx */
/**
 * Portal layout render helper.
 * Wraps raw inner HTML (from route handlers) in the full Layout component.
 * Used by the portal index middleware to inject sidebar into all portal pages.
 */

import { renderToString } from 'hono/jsx/dom/server';
import { Layout }         from '../views/layout.js';
import type { JWTPayload } from '../types/jwt.js';

/**
 * Wraps `innerHtml` (the body content of a portal page) in the shared Layout.
 * The Layout renders the sidebar, header, Alpine.js, and CSS.
 */
export function renderPortalPage(
  user:        JWTPayload,
  currentPath: string,
  title:       string,
  innerHtml:   string,
): string {
  return (
    '<!DOCTYPE html>' +
    renderToString(
      <Layout title={title} user={user} currentPath={currentPath}>
        <div class="p-6" dangerouslySetInnerHTML={{ __html: innerHtml }} />
      </Layout>,
    )
  );
}
