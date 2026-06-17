import { apiRequest } from "@/lib/api-client";

export type VideoComment = {
  id: string;
  body: string;
  likesCount: number;
  liked?: boolean;
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
  );
}

export function postVideoComment(videoId: string, body: string, parentId?: string) {
  return apiRequest<VideoComment>(`/videos/${videoId}/comments`, {
    method: "POST",
    body: parentId ? { body, parentId } : { body },
  });
}

export function toggleCommentLike(commentId: string) {
  return apiRequest<{ liked: boolean; likesCount: number }>(
    `/videos/comments/${commentId}/like`,
    { method: "POST" },
  );
}

export function deleteVideoComment(commentId: string) {
  return apiRequest<{ success: boolean; deletedIds: string[] }>(
    `/videos/comments/${commentId}`,
    { method: "DELETE" },
  );
}

/** Normalize API/Prisma comment payloads for the UI. */
export function normalizeVideoComment(raw: Record<string, unknown>): VideoComment {
  const user = (raw.user ?? {}) as VideoComment["user"];
  return {
    id: String(raw.id),
    body: String(raw.body ?? ""),
    likesCount: Number(raw.likesCount ?? 0),
    liked: Boolean(raw.liked),
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(String(raw.createdAt)).toISOString(),
    user: {
      id: String(user.id ?? ""),
      username: String(user.username ?? "user"),
      displayName: user.displayName ?? null,
      avatarUrl: user.avatarUrl ?? null,
    },
    replies: Array.isArray(raw.replies)
      ? (raw.replies as Record<string, unknown>[]).map(normalizeVideoComment)
      : undefined,
  };
}
