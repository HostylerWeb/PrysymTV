import { apiRequest } from "@/lib/api-client";

export type ReportTargetType =
  | "video"
  | "comment"
  | "stream"
  | "user"
  | "podcast_episode"
  | "vertical_episode"
  | "vertical_series";

export type ReportReason =
  | "spam"
  | "nudity"
  | "violence"
  | "harassment"
  | "other";

export function submitReport(body: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}) {
  return apiRequest<{ success: boolean }>("/reports", {
    method: "POST",
    body,
  });
}
