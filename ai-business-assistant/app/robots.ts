import type { MetadataRoute } from "next";

import { APP_URL } from "@/utils/constants";

/**
 * Generates /robots.txt.
 * Blocks crawlers from auth and dashboard routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing"],
        disallow: [
          "/dashboard/",
          "/profile/",
          "/settings/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
