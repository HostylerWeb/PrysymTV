import { apiRequest } from "@/lib/api-client";

export type CategoryItem = { slug: string; label: string };

export type ContentCategory = {
  slug: string;
  label: string;
  vertical?: string | null;
};

const FALLBACK_MOVIE_GENRES: CategoryItem[] = [
  { slug: "action", label: "Action" },
  { slug: "comedy", label: "Comedy" },
  { slug: "drama", label: "Drama" },
  { slug: "thriller", label: "Thriller" },
  { slug: "sci-fi", label: "Sci-Fi" },
  { slug: "horror", label: "Horror" },
  { slug: "romance", label: "Romance" },
  { slug: "documentary", label: "Documentary" },
];

const FALLBACK_VIDEO_CATEGORIES: ContentCategory[] = [
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

const FALLBACK_PODCAST_CATEGORIES: CategoryItem[] = [
  { slug: "true-crime", label: "True Crime" },
  { slug: "tech", label: "Tech" },
  { slug: "business", label: "Business" },
  { slug: "comedy", label: "Comedy" },
  { slug: "health", label: "Health" },
  { slug: "society", label: "Society" },
  { slug: "science", label: "Science" },
  { slug: "sports", label: "Sports" },
  { slug: "music", label: "Music" },
];

export function fetchVideoCategories() {
  return apiRequest<{ items: ContentCategory[] }>("/categories/videos", {
    auth: false,
  }).catch(() => ({ items: FALLBACK_VIDEO_CATEGORIES }));
}

export function fetchMovieGenres() {
  return apiRequest<{ items: CategoryItem[] }>("/categories/movies", {
    auth: false,
  }).catch(() => ({ items: FALLBACK_MOVIE_GENRES }));
}

export function fetchPodcastCategories() {
  return apiRequest<{ items: CategoryItem[] }>("/categories/podcasts", {
    auth: false,
  }).catch(() => ({ items: FALLBACK_PODCAST_CATEGORIES }));
}

export function genreLabel(
  slug: string | null | undefined,
  genres: CategoryItem[],
): string {
  if (!slug) return "Drama";
  const match = genres.find((g) => g.slug === slug);
  return match?.label ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
