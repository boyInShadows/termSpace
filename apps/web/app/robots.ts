import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Personal and staff surfaces are private; the catalogue is what search should see. */
const PRIVATE = ["/dashboard", "/account", "/creator", "/moderation", "/backend", "/design-system"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE, ...PRIVATE.map((path) => `/fa${path}`)] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
