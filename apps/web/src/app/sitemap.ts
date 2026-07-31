import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://akademitrading.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "hourly" as const },
    { path: "/screener", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/signals", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/heatmap", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/sectors", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/calendar", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/dividends", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/education", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ideas", priority: 0.7, changeFrequency: "hourly" as const },
    { path: "/subscription", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/auth/login", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/auth/register", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let codes: string[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/stocks/codes`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const json = await res.json();
      codes = Array.isArray(json.data) ? json.data : [];
    }
  } catch {
    codes = [];
  }

  const stockEntries: MetadataRoute.Sitemap = codes.map((code) => ({
    url: `${BASE_URL}/stocks/${code}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticEntries, ...stockEntries];
}
