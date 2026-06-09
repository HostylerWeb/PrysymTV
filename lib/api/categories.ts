import { apiRequest } from "@/lib/api-client";

export type ContentCategory = {
  slug: string;
  label: string;
  vertical?: string;
};

export function fetchVideoCategories() {
  return apiRequest<{ items: ContentCategory[] }>("/categories/videos", {
    auth: false,
  });
}

export function fetchPodcastCategories() {
  return apiRequest<{ items: ContentCategory[] }>("/categories/podcasts", {
    auth: false,
  });
}
