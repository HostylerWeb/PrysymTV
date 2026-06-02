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

export async function applyStreamer(description: string, idDocumentUrl: string) {
  return apiRequest<MessageResponse & { streamerStatus?: string }>(
    "/users/apply-streamer",
    {
      method: "POST",
      body: { description, idDocumentUrl },
    },
  );
}
