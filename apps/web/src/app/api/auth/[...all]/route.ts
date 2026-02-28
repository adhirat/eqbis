import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Must run on the Edge Runtime for Cloudflare Pages compatibility
export const runtime = "edge";

export const { GET, POST } = toNextJsHandler(auth);
