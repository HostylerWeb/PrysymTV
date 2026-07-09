import { apiRequest } from './client';
import type { PaginatedMeta, VideoCardDetail } from '@/types/api';

export function fetchVideo(id: string) {
  return apiRequest<VideoCardDetail & { description?: string | null; hlsMasterUrl?: string | null }>(
    `/videos/${id}`,
  );
}

export function postVideoView(id: string) {
  return apiRequest<{ viewsCount: number }>(`/videos/${id}/view`, { method: 'POST' });
}

export function toggleVideoLike(id: string) {
  return apiRequest<{ liked: boolean; likesCount: number }>(`/videos/${id}/like`, {
    method: 'POST',
  });
}

export function toggleVideoDislike(id: string) {
  return apiRequest<{ disliked: boolean }>(`/videos/${id}/dislike`, { method: 'POST' });
}

export function toggleVideoSave(id: string) {
  return apiRequest<{ saved: boolean }>(`/videos/${id}/save`, { method: 'POST' });
}

export function fetchVideoComments(id: string, page = 1, limit = 20) {
  return apiRequest<{ items: unknown[]; meta: PaginatedMeta }>(
    `/videos/${id}/comments?page=${page}&limit=${limit}`,
  );
}

export function postVideoComment(id: string, body: string, parentId?: string) {
  return apiRequest<unknown>(`/videos/${id}/comments`, {
    method: 'POST',
    body: { body, ...(parentId ? { parentId } : {}) },
  });
}

export function initVideoUpload(body: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>('/videos/upload/init', {
    method: 'POST',
    body,
  });
}

export function completeVideoUpload(body: { videoId: string; objectKey?: string }) {
  return apiRequest<Record<string, unknown>>('/videos/upload/complete', {
    method: 'POST',
    body,
  });
}
