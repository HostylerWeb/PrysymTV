export type NotificationMetadata = {
  dedupeKey?: string;
  videoType?: string;
  videoId?: string;
  commentId?: string;
  contentType?: "video" | "vertical_episode" | "podcast_episode";
  seriesSlug?: string;
  episodeNumber?: number;
  podcastEpisodeId?: string;
  processingPhase?: "started" | "complete" | "failed";
  contentLabel?: string;
};

function verticalEpisodeUrl(
  seriesSlug?: string,
  episodeNumber?: number,
  commentId?: string,
  openComments = false,
): string | undefined {
  if (!seriesSlug || episodeNumber == null) return undefined;
  return `/verticals/watch/${seriesSlug}/${episodeNumber}${commentQuery(commentId, openComments)}`;
}

function podcastEpisodeUrl(podcastEpisodeId?: string): string | undefined {
  if (!podcastEpisodeId) return undefined;
  return `/podcast/${podcastEpisodeId}`;
}

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
  const contentType = metadata?.contentType;

  if (contentType === "vertical_episode") {
    const url = verticalEpisodeUrl(
      metadata?.seriesSlug,
      metadata?.episodeNumber,
      commentId,
      type === "comment",
    );
    if (url) return url;
  }

  if (contentType === "podcast_episode") {
    const url = podcastEpisodeUrl(metadata?.podcastEpisodeId ?? referenceId ?? undefined);
    if (url) return url;
  }

  switch (type) {
    case "follow":
      if (!actorUsername) return undefined;
      return `/creator/${actorUsername.replace(/^@/, "")}`;

    case "like":
    case "comment": {
      if (contentType === "vertical_episode") {
        return verticalEpisodeUrl(
          metadata?.seriesSlug,
          metadata?.episodeNumber,
          commentId,
          type === "comment",
        );
      }
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
      if (contentType === "vertical_episode") {
        return verticalEpisodeUrl(metadata?.seriesSlug, metadata?.episodeNumber);
      }
      if (!videoId) return undefined;
      if (videoType === "short") return `/shorts?start=${encodeURIComponent(videoId)}`;
      if (videoType === "movie") return `/movie/${videoId}`;
      return `/watch/${videoId}`;
    }

    case "live":
    case "gift":
      return referenceId ? `/live/${referenceId}` : undefined;

    case "system": {
      const phase = metadata?.processingPhase;
      if (phase === "started" || phase === "failed") {
        return undefined;
      }

      if (metadata?.contentType === "vertical_episode") {
        const url = verticalEpisodeUrl(metadata?.seriesSlug, metadata?.episodeNumber);
        if (url) return url;
      }
      if (metadata?.contentType === "podcast_episode") {
        return podcastEpisodeUrl(metadata?.podcastEpisodeId ?? referenceId ?? undefined);
      }
      if (videoId) {
        if (videoType === "short") return `/shorts?start=${encodeURIComponent(videoId)}`;
        if (videoType === "movie") return `/movie/${videoId}`;
        return `/watch/${videoId}`;
      }
      return "/profile";
    }

    default:
      return undefined;
  }
}
