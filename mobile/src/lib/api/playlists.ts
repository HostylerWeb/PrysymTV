import { apiRequest } from './client';

export function fetchDiscoverPlaylists(limit = 12) {
  return apiRequest<unknown[]>(`/playlists/discover?limit=${limit}`, { auth: false });
}

export function fetchMyPlaylists() {
  return apiRequest<unknown[]>('/playlists/me');
}

export function fetchPlaylist(id: string) {
  return apiRequest<Record<string, unknown>>(`/playlists/${id}`);
}

export function createPlaylist(body: Record<string, unknown>) {
  return apiRequest<unknown>('/playlists', { method: 'POST', body });
}

export function addPlaylistItem(playlistId: string, body: { itemType: string; itemId: string }) {
  return apiRequest<unknown>(`/playlists/${playlistId}/items`, { method: 'POST', body });
}
