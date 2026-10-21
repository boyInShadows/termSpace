import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  reactStrictMode: true,
  poweredByHeader: false,
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
      { source: "/:path*", headers: securityHeaders },
      // Versioned file names (estedad-…-v5.3.0.woff2), so safe to keep forever.
      { source: "/fonts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};
export default nextConfig;
