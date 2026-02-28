import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PORTAL_PATH = "/portal";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // ── Tenant resolution ────────────────────────────────────────────────────
  const rootDomain = process.env.ROOT_DOMAIN ?? "eqbis.com";
  const isRootDomain =
    host === rootDomain ||
    host === `www.${rootDomain}` ||
    host === "localhost:3000" ||
    host === "app.localhost:3000";

  const rawSubdomain = host.split(".")[0];
  const isTenantSubdomain =
    !isRootDomain &&
    rawSubdomain !== "www" &&
    rawSubdomain !== "app" &&
    rawSubdomain !== host.split(":")[0]; // guard bare localhost

  const response = NextResponse.next({ request });

  if (isTenantSubdomain) {
    response.headers.set("x-tenant-slug", rawSubdomain);
  }

  // ── Auth guard (local JWT decode — no network round-trip) ────────────────
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user ?? null;

  if (pathname.startsWith(PORTAL_PATH) && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/auth") && user) {
    return NextResponse.redirect(new URL(PORTAL_PATH + "/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
