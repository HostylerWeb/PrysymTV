import { apiRequest } from './client';

export type CategoryItem = { slug: string; label: string };

export type ContentCategory = {
  slug: string;
  label: string;
  vertical?: string | null;
};

const FALLBACK_VIDEO_CATEGORIES: ContentCategory[] = [
  { slug: 'general', label: 'General', vertical: 'general' },
  { slug: 'sports', label: 'Sports', vertical: 'sports' },
  { slug: 'concerts', label: 'Concerts', vertical: 'concert' },
  { slug: 'community', label: 'Community Events', vertical: 'community_event' },
  { slug: 'education', label: 'Educational Programs', vertical: 'education' },
  { slug: 'cooking', label: 'Cooking', vertical: 'general' },
  { slug: 'coaching', label: 'Coaching', vertical: 'education' },
  { slug: 'fitness', label: 'Fitness & Wellness', vertical: 'sports' },
  { slug: 'gaming', label: 'Gaming', vertical: 'general' },
  { slug: 'music', label: 'Music', vertical: 'concert' },
  { slug: 'technology', label: 'Technology', vertical: 'education' },
  { slug: 'news', label: 'News & Commentary', vertical: 'general' },
  { slug: 'comedy', label: 'Comedy', vertical: 'general' },
  { slug: 'travel', label: 'Travel & Adventure', vertical: 'general' },
  { slug: 'fashion', label: 'Fashion & Beauty', vertical: 'general' },
];

const FALLBACK_PODCAST_CATEGORIES: CategoryItem[] = [
  { slug: 'general', label: 'General' },
  { slug: 'tech', label: 'Tech' },
  { slug: 'true-crime', label: 'True Crime' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'education', label: 'Education' },
];

export function fetchVideoCategories() {
  return apiRequest<{ items: ContentCategory[] }>('/categories/videos', { auth: false }).catch(
    () => ({ items: FALLBACK_VIDEO_CATEGORIES }),
  );
}

export function fetchMovieGenres() {
  return apiRequest<{ items: CategoryItem[] }>('/categories/movies', { auth: false }).catch(
    () => ({ items: [] as CategoryItem[] }),
  );
}

export function fetchPodcastCategories() {
  return apiRequest<{ items: CategoryItem[] }>('/categories/podcasts', { auth: false }).catch(
    () => ({ items: FALLBACK_PODCAST_CATEGORIES }),
  );
}
