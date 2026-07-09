import { apiRequest } from './client';
import { uploadPickedFile, type FileUploadInit } from './profile-upload';
import type { VideoDetail } from '@/types/api';

export type UploadInitBody = {
  type: 'short' | 'video' | 'podcast' | 'movie';
  title: string;
  description?: string;
  category?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  tags?: string;
  mimeType: string;
  fileName?: string;
  verticalEpisodeId?: string;
};

export type UploadInitResponse = FileUploadInit & {
  videoId: string;
  status: string;
  maxUploadBytes: number;
};

export type UploadCompleteResponse = {
  videoId: string;
  status: string;
  message: string;
};

export function fetchVideo(id: string) {
  return apiRequest<VideoDetail>(`/videos/${id}`);
}

export function postVideoView(id: string) {
  return apiRequest<{ success?: boolean; viewsCount: number }>(`/videos/${id}/view`, {
    method: 'POST',
    auth: false,
  });
}

export function toggleVideoLike(id: string) {
  return apiRequest<{ liked: boolean; likesCount?: number; disliked?: boolean }>(
    `/videos/${id}/like`,
    { method: 'POST' },
  );
}

export function toggleVideoDislike(id: string) {
  return apiRequest<{ disliked: boolean; liked?: boolean }>(`/videos/${id}/dislike`, {
    method: 'POST',
  });
}

export function toggleVideoSave(id: string) {
  return apiRequest<{ saved: boolean }>(`/videos/${id}/save`, { method: 'POST' });
}

export function initVideoUpload(body: UploadInitBody) {
  return apiRequest<UploadInitResponse>('/videos/upload/init', {
    method: 'POST',
    body,
  });
}

export function completeVideoUpload(body: { videoId: string; objectKey?: string }) {
  return apiRequest<UploadCompleteResponse>('/videos/upload/complete', {
    method: 'POST',
    body,
  });
}

export async function uploadVideoFile(
  init: UploadInitResponse,
  file: { uri: string; name?: string | null; mimeType?: string | null },
) {
  await uploadPickedFile(init, file);
}

export async function runVideoUpload(params: {
  type: 'short' | 'video' | 'movie';
  title: string;
  description?: string;
  category?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  tags?: string;
  file: { uri: string; name?: string | null; mimeType?: string | null };
}) {
  const mimeType = params.file.mimeType || 'video/mp4';
  const init = await initVideoUpload({
    type: params.type,
    title: params.title,
    description: params.description,
    category: params.category,
    visibility: params.visibility,
    tags: params.tags,
    mimeType,
    fileName: params.file.name ?? 'video.mp4',
  });
  await uploadVideoFile(init, params.file);
  return completeVideoUpload({ videoId: init.videoId, objectKey: init.objectKey });
}

export function updateMyVideo(videoId: string, body: { title?: string; description?: string }) {
  return apiRequest<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
  }>(`/videos/${videoId}`, { method: 'PATCH', body });
}

export function deleteMyVideo(videoId: string) {
  return apiRequest<{ success: boolean }>(`/videos/${videoId}`, { method: 'DELETE' });
}
