export type NotificationMetadata = {
  dedupeKey?: string;
  videoType?: string;
  videoId?: string;
  commentId?: string;
};

function commentQuery(commentId?: string, openComments = false): string {
  const params = new URLSearchParams();
  if (openComments || commentId) params.set("comments", "1");
  if (commentId) params.set("comment", commentId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Resolves in-app navigation for a notification row. */
export function buildNotificationActionUrl(
  type: string,
  referenceId: string | null,
  metadata?: NotificationMetadata | null,
  actorUsername?: string | null,
): string | undefined {
  const videoId = metadata?.videoId ?? referenceId ?? undefined;
  const videoType = metadata?.videoType;
  const commentId = metadata?.commentId;

  switch (type) {
    case "follow":
      if (!actorUsername) return undefined;
      return `/creator/${actorUsername.replace(/^@/, "")}`;

    case "like":
    case "comment": {
      if (!videoId) return undefined;
      if (videoType === "short") {
        const params = new URLSearchParams({ start: videoId });
        if (commentId || type === "comment") {
          params.set("comments", "1");
          if (commentId) params.set("comment", commentId);
        }
        return `/shorts?${params}`;
      }
      if (videoType === "movie") {
        return `/movie/${videoId}`;
      }
      return `/watch/${videoId}${commentQuery(commentId, type === "comment")}`;
    }

    case "upload": {
      if (!videoId) return undefined;
      if (videoType === "short") return `/shorts?start=${encodeURIComponent(videoId)}`;
      if (videoType === "movie") return `/movie/${videoId}`;
      return `/watch/${videoId}`;
    }

    case "live":
    case "gift":
      return referenceId ? `/live/${referenceId}` : undefined;

    default:
      return undefined;
  }
}
