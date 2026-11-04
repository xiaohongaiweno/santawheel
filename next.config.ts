import type { NextConfig } from "next";

const privateRoutes = [
  "/a/:path*",
  "/manage/:path*",
  "/remove/:path*",
  "/api/manage/:path*",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      // Token-addressed pages must never be indexed, cached, or leak the
      // token through the Referer header.
      ...privateRoutes.map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
