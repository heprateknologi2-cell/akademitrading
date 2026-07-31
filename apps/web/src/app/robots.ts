import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://akademitrading.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/screener", "/signals", "/heatmap", "/sectors", "/calendar", "/dividends", "/ideas", "/subscription", "/auth/login", "/auth/register"],
        disallow: ["/dashboard", "/portfolio", "/settings", "/backtest", "/ideas/new", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
