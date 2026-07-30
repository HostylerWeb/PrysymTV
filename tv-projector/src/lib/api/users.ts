import type { CreatorVideoItem, MeResponse, PublicCreatorProfile, UpdateMeBody } from '@/types/api';
import { normalizeUsernameSlug } from '@/lib/username-slug';
import { apiRequest } from './client';

function userPath(username: string): string {
  return encodeURIComponent(normalizeUsernameSlug(username));
}

export async function fetchMe() {
  return apiRequest<MeResponse>('/users/me');
}

export async function updateMe(body: UpdateMeBody) {
  return apiRequest<MeResponse>('/users/me', {
    method: 'PUT',
    body,
  });
}

export function replaceSocialLinks(
  links: Array<{ label: string; url: string; sortOrder: number }>,
) {
  return apiRequest<MeResponse>('/users/me/social-links', {
    method: 'PUT',
    body: { links },
  });
}

export async function applyStreamer(description: string, idDocumentUrl: string) {
  return apiRequest<{ message: string; streamerStatus?: string }>('/users/apply-streamer', {
    method: 'POST',
    body: { description, idDocumentUrl },
  });
}

export async function applyVerticalCreator(
  description: string,
  idDocumentUrl: string,
  portfolioUrl?: string,
) {
  return apiRequest<{ message: string; verticalCreatorStatus?: string }>(
    '/users/apply-vertical-creator',
    {
      method: 'POST',
      body: { description, idDocumentUrl, portfolioUrl },
    },
  );
}

export async function requestCreatorAccess(body: {
  features: Array<'vertical' | 'live' | 'store'>;
  description?: string;
  acceptedStoreTerms?: boolean;
}) {
  return apiRequest<{
    success: boolean;
    identityVerified: boolean;
    results: Record<string, string>;
  }>('/users/request-creator-access', {
    method: 'POST',
    body,
  });
}

export async function fetchMyVideos(page = 1, limit = 24) {
  return apiRequest<import('@/types/api').PaginatedVideos>(
    `/users/me/videos?page=${page}&limit=${limit}`,
  );
}

export async function fetchMySaved(page = 1, limit = 24) {
  return apiRequest<{
    items: import('@/types/api').SavedItemRecord[];
    meta: import('@/types/api').PaginatedMeta;
  }>(`/users/me/saved?page=${page}&limit=${limit}`);
}

export async function fetchMyLiked(page = 1, limit = 24) {
  return apiRequest<{
    items: import('@/types/api').LikedItemRecord[];
    meta: import('@/types/api').PaginatedMeta;
  }>(`/users/me/liked?page=${page}&limit=${limit}`);
}

export function fetchPublicProfile(username: string) {
  return apiRequest<PublicCreatorProfile>(`/users/${userPath(username)}`, {
    auth: true,
  });
}

export function fetchCreatorVideos(username: string, page = 1, limit = 24) {
  return apiRequest<{
    items: CreatorVideoItem[];
    meta: { page: number; limit: number; total: number };
  }>(`/users/${userPath(username)}/videos?page=${page}&limit=${limit}`, { auth: false });
}

export function followUser(username: string) {
  return apiRequest<{ following: boolean }>(`/users/${userPath(username)}/follow`, {
    method: 'POST',
  });
}

export function unfollowUser(username: string) {
  return apiRequest<{ following: boolean }>(`/users/${userPath(username)}/follow`, {
    method: 'DELETE',
  });
}

export function toggleLiveAlerts(username: string) {
  return apiRequest<{ enabled: boolean }>(`/users/${userPath(username)}/live-alerts`, {
    method: 'POST',
  });
}
