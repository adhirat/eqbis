import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@eqbis/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

// Enable Cloudflare local dev bindings (R2, KV, D1) when running `next dev`.
// This is a no-op in production. Done outside the export to avoid
// top-level await issues in the CommonJS config loader.
if (process.env.NODE_ENV === "development") {
  import("@cloudflare/next-on-pages/next-dev")
    .then(({ setupDevPlatform }) => setupDevPlatform())
    .catch(() => {
      // Silently ignore — bindings are optional for local dev
    });
}

export default nextConfig;
