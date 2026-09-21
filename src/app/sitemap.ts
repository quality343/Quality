import type { MetadataRoute } from "next";
import { listServices } from "@/server/services/queries";

/**
 * Public-only sitemap.
 *
 * Portal, authentication, booking-management and API routes are deliberately
 * absent — they are private surfaces and must never be indexed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/book-appointment", priority: 0.95, changeFrequency: "weekly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/hearing-tests", priority: 0.9, changeFrequency: "monthly" },
    { path: "/hearing-aids", priority: 0.9, changeFrequency: "monthly" },
    { path: "/home-consultation", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/branches", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.5, changeFrequency: "monthly" },
  ];

  // Service detail pages are database-driven, so they stay in step with the
  // catalogue automatically.
  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const services = await listServices();
    serviceRoutes = services.map((service) => ({
      url: `${base}/services/${service.code.toLowerCase()}`,
      lastModified: service.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // Never let a catalogue hiccup break the sitemap.
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...serviceRoutes,
  ];
}
