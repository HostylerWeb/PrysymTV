import { apiRequest } from './client';
import type { PaginatedMeta, VideoComment } from '@/types/api';

export function fetchVideoComments(id: string, page = 1, limit = 30) {
  return apiRequest<{ items: VideoComment[]; meta: PaginatedMeta }>(
    `/videos/${id}/comments?page=${page}&limit=${limit}`,
  );
}

export function postVideoComment(id: string, body: string, parentId?: string) {
  return apiRequest<VideoComment>(`/videos/${id}/comments`, {
    method: 'POST',
    body: parentId ? { body, parentId } : { body },
  });
}

export function toggleCommentLike(commentId: string) {
  return apiRequest<{ liked: boolean; likesCount: number }>(
    `/videos/comments/${commentId}/like`,
    { method: 'POST' },
  );
}

export function deleteVideoComment(commentId: string) {
  return apiRequest<{ success: boolean }>(`/videos/comments/${commentId}`, {
    method: 'DELETE',
  });
}
