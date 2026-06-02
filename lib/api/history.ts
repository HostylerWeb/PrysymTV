import { apiRequest } from "@/lib/api-client";
import type { HistoryItemRecord, PaginatedMeta } from "@/lib/api/types";

export async function fetchHistory(page = 1, limit = 12) {
  return apiRequest<{ items: HistoryItemRecord[]; meta: PaginatedMeta }>(
    `/history?page=${page}&limit=${limit}`,
  );
}

export async function saveWatchProgress(body: {
  contentType: "video" | "podcast_episode";
  contentId: string;
  progressSeconds: number;
  completed?: boolean;
}) {
  return apiRequest("/history/progress", {
    method: "POST",
    body,
  });
}
