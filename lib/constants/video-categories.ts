/** Long-form video browse categories (maps to `videos.vertical` / programs pillars). */
export const VIDEO_CATEGORIES = [
  { slug: "all", label: "All", vertical: null as string | null },
  { slug: "general", label: "General", vertical: "general" },
  { slug: "sports", label: "Sports", vertical: "sports" },
  { slug: "concerts", label: "Concerts", vertical: "concert" },
  { slug: "community", label: "Community", vertical: "community_event" },
  { slug: "education", label: "Education", vertical: "education" },
] as const;

export type VideoBrowseMode = "all" | "videos" | "live";
export type VideoBrowseSort = "views" | "newest";

export function verticalForCategorySlug(slug: string): string | undefined {
  const row = VIDEO_CATEGORIES.find((c) => c.slug === slug);
  return row?.vertical ?? undefined;
}
