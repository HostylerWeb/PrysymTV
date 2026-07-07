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
  { slug: "cooking", label: "Cooking", vertical: "general" },
  { slug: "coaching", label: "Coaching", vertical: "education" },
  { slug: "fitness", label: "Fitness & Wellness", vertical: "sports" },
  { slug: "gaming", label: "Gaming", vertical: "general" },
  { slug: "music", label: "Music", vertical: "concert" },
  { slug: "technology", label: "Technology", vertical: "education" },
  { slug: "news", label: "News & Commentary", vertical: "general" },
  { slug: "comedy", label: "Comedy", vertical: "general" },
  { slug: "travel", label: "Travel & Adventure", vertical: "general" },
  { slug: "fashion", label: "Fashion & Beauty", vertical: "general" },
];

export type VideoBrowseMode = "all" | "videos" | "live";
export type VideoBrowseSort = "views" | "newest";

export function verticalForCategorySlug(
  slug: string,
  categories: VideoCategory[] = FALLBACK_VIDEO_CATEGORIES,
): string | undefined {
  const row = categories.find((c) => c.slug === slug);
  return row?.vertical ?? undefined;
}
