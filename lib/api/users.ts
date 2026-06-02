import { apiRequest } from "@/lib/api-client";
import type {
  LikedItemRecord,
  MeResponse,
  MessageResponse,
  PaginatedVideos,
  SavedItemRecord,
  UpdateMeBody,
} from "@/lib/api/types";

export async function fetchMe() {
  return apiRequest<MeResponse>("/users/me");
}

export async function updateMe(body: UpdateMeBody) {
  return apiRequest<MeResponse>("/users/me", {
    method: "PUT",
    body,
  });
}

export async function fetchMyVideos(page = 1, limit = 24) {
  return apiRequest<PaginatedVideos>(
    `/users/me/videos?page=${page}&limit=${limit}`,
  );
}

export async function fetchMySaved(page = 1, limit = 24) {
  return apiRequest<{ items: SavedItemRecord[]; meta: PaginatedVideos["meta"] }>(
    `/users/me/saved?page=${page}&limit=${limit}`,
  );
}

export async function fetchMyLiked(page = 1, limit = 24) {
  return apiRequest<{ items: LikedItemRecord[]; meta: PaginatedVideos["meta"] }>(
    `/users/me/liked?page=${page}&limit=${limit}`,
  );
}

export type PublicCreatorProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  streamerStatus: string;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  isLive: boolean;
  liveStreamId: string | null;
  socialLinks: Array<{ label: string; url: string; sortOrder: number }>;
};

export function fetchPublicProfile(username: string) {
  return apiRequest<PublicCreatorProfile>(`/users/${encodeURIComponent(username)}`, {
    auth: false,
  });
}

export function fetchCreatorVideos(username: string, page = 1, limit = 24) {
  return apiRequest<{
    items: Array<{
      id: string;
      title: string;
      thumbnailUrl: string | null;
      durationSeconds: number;
      viewsCount: number;
      type: string;
      channel: string;
      channelSlug: string;
    }>;
    meta: { page: number; limit: number; total: number };
  }>(
    `/users/${encodeURIComponent(username)}/videos?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

export function followUser(username: string) {
  return apiRequest<{ following: boolean }>(`/users/${encodeURIComponent(username)}/follow`, {
    method: "POST",
  });
}

export function unfollowUser(username: string) {
  return apiRequest<{ following: boolean }>(
    `/users/${encodeURIComponent(username)}/follow`,
    { method: "DELETE" },
  );
}

export async function applyStreamer(description: string, idDocumentUrl: string) {
  return apiRequest<MessageResponse & { streamerStatus?: string }>(
    "/users/apply-streamer",
    {
      method: "POST",
      body: { description, idDocumentUrl },
    },
  );
}
