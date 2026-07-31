import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://akademitrading.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "hourly" as const },
    { path: "/screener", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/signals", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/subscription", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/auth/login", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/auth/register", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
