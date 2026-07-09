import { apiRequest } from './client';
import type { PlaylistDetail } from '@/types/api';
import { normalizeUsernameSlug } from '@/lib/username-slug';

export type ApiPlaylistSummary = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  type: string;
  visibility?: string;
  itemCount: number;
  updatedAt?: string;
};

export function fetchDiscoverPlaylists(limit = 12) {
  return apiRequest<{ items: ApiPlaylistSummary[] }>(`/playlists/discover?limit=${limit}`, {
    auth: false,
  });
}

export function fetchMyPlaylists() {
  return apiRequest<{ items: ApiPlaylistSummary[] }>('/playlists/me');
}

export function fetchPlaylist(id: string) {
  return apiRequest<PlaylistDetail>(`/playlists/${id}`, { auth: false });
}

export function fetchCreatorPlaylists(username: string) {
  return apiRequest<{ items: ApiPlaylistSummary[] }>(
    `/users/${encodeURIComponent(normalizeUsernameSlug(username))}/playlists`,
    { auth: false },
  );
}

export function createPlaylist(body: {
  title: string;
  description?: string;
  type: 'video' | 'podcast' | 'mixed';
  visibility?: 'public' | 'private';
  coverUrl?: string;
}) {
  return apiRequest<{ id: string }>('/playlists', { method: 'POST', body });
}

export function updatePlaylist(
  id: string,
  body: {
    title?: string;
    description?: string;
    visibility?: 'public' | 'private';
    coverUrl?: string;
  },
) {
  return apiRequest<ApiPlaylistSummary>(`/playlists/${id}`, { method: 'PUT', body });
}

export function deletePlaylist(id: string) {
  return apiRequest<{ success: boolean }>(`/playlists/${id}`, { method: 'DELETE' });
}

export function addPlaylistItem(
  playlistId: string,
  body: { itemType: 'video' | 'podcast_episode'; itemId: string },
) {
  return apiRequest<{ id: string; duplicate?: boolean }>(
    `/playlists/${playlistId}/items`,
    { method: 'POST', body },
  );
}

export function removePlaylistItem(playlistId: string, playlistItemId: string) {
  return apiRequest<{ success: boolean }>(
    `/playlists/${playlistId}/items/${playlistItemId}`,
    { method: 'DELETE' },
  );
}

export function reorderPlaylistItems(playlistId: string, itemIds: string[]) {
  return apiRequest<{ success: boolean }>(`/playlists/${playlistId}/reorder`, {
    method: 'PUT',
    body: { itemIds },
  });
}
