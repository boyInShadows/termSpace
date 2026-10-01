import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { useTypeScriptCli: false },
  async redirects() {
    return ["", "/fa"].flatMap((prefix) => [
      { source: `${prefix}/creator/:path*`, destination: `${prefix}/dashboard/creator/:path*`, permanent: false },
      { source: `${prefix}/moderation/:path*`, destination: `${prefix}/dashboard/moderation/:path*`, permanent: false },
    ]);
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
};
export default nextConfig;
