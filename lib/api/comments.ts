import { apiRequest } from "@/lib/api-client";

export type VideoComment = {
  id: string;
  body: string;
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  replies?: VideoComment[];
};

export function fetchVideoComments(videoId: string, page = 1) {
  return apiRequest<{ items: VideoComment[]; meta: { page: number; limit: number; total: number } }>(
    `/videos/${videoId}/comments?page=${page}`,
    { auth: false },
  );
}

export function postVideoComment(videoId: string, body: string, parentId?: string) {
  return apiRequest<VideoComment>(`/videos/${videoId}/comments`, {
    method: "POST",
    body: { body, parentId },
  });
}
