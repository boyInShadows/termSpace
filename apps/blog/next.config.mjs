import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "images.unsplash.com")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
  images: {
    remotePatterns: [
      ...imageHosts.map((hostname) => ({ protocol: "https", hostname })),
      ...(process.env.NODE_ENV !== "production" ? [{ protocol: "http", hostname: "localhost" }, { protocol: "http", hostname: "127.0.0.1" }] : []),
    ],
  },
};

export default withNextIntl(nextConfig);
