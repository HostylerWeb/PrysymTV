import type { ProgramItem } from "@/lib/api/programs";

export type VideoCategory = {
  slug: string;
  label: string;
  vertical: string | null;
};

/** Fallback when API is unavailable. */
export const FALLBACK_VIDEO_CATEGORIES: VideoCategory[] = [
  { slug: "all", label: "All", vertical: null },
  { slug: "general", label: "General", vertical: "general" },
  { slug: "sports", label: "Sports", vertical: "sports" },
  { slug: "concerts", label: "Concerts", vertical: "concert" },
  { slug: "community", label: "Community", vertical: "community_event" },
  { slug: "education", label: "Education", vertical: "education" },
];

export type VideoBrowseMode = "all" | "videos" | "live";
export type VideoBrowseSort = "views" | "newest";

export function buildVideoCategories(programs: ProgramItem[]): VideoCategory[] {
  return [
    { slug: "all", label: "All", vertical: null },
    { slug: "general", label: "General", vertical: "general" },
    ...programs.map((p) => ({
      slug: p.slug,
      label: p.label,
      vertical: p.vertical,
    })),
  ];
}

export function verticalForCategorySlug(
  slug: string,
  categories: VideoCategory[] = FALLBACK_VIDEO_CATEGORIES,
): string | undefined {
  const row = categories.find((c) => c.slug === slug);
  return row?.vertical ?? undefined;
}
