import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "" },
  experimental: { useTypeScriptCli: false },
  // The creator workspace used to live at /creator, beside the dashboard's own
  // studio. There is one place now: /dashboard/studio.
  async redirects() {
    return ["", "/fa"].flatMap((prefix) => [
      { source: `${prefix}/creator`, destination: `${prefix}/dashboard/studio`, permanent: true },
      { source: `${prefix}/creator/listings/:path*`, destination: `${prefix}/dashboard/studio/listings/:path*`, permanent: true },
    ]);
  },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "X-Frame-Options", value: "DENY" },
      ] },
      // Versioned file names (estedad-…-v5.3.0.woff2), so safe to keep forever.
      { source: "/fonts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};
export default nextConfig;
