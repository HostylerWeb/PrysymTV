import { apiRequest } from './client';

export function fetchVideoCategories() {
  return apiRequest<unknown[]>('/categories/videos', { auth: false });
}

export function fetchMovieGenres() {
  return apiRequest<unknown[]>('/categories/movies', { auth: false });
}

export function fetchPodcastCategories() {
  return apiRequest<unknown[]>('/categories/podcasts', { auth: false });
}
