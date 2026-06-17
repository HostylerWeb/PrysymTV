import { apiRequest, loadStoredAccessToken } from "@/lib/api-client";

export type MyPodcastShow = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  category: string | null;
  episodes: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    durationSeconds: number;
    publishedAt: string | null;
  }>;
  _count: { episodes: number };
};

export function fetchMyPodcastShows() {
  return apiRequest<{ items: MyPodcastShow[] }>("/podcasts/shows/me");
}

export function createPodcastShow(body: {
  title: string;
  description?: string;
  coverUrl?: string;
  category?: string;
}) {
  return apiRequest<{ id: string }>("/podcasts/shows", {
    method: "POST",
    body,
  });
}

export function updatePodcastEpisode(
  episodeId: string,
  body: { title?: string; description?: string },
) {
  return apiRequest<{ id: string; title: string; description: string | null }>(
    `/podcasts/episodes/${episodeId}`,
    { method: "PATCH", body },
  );
}

export function createPodcastEpisode(
  showId: string,
  body: { title: string; description?: string; coverUrl?: string },
) {
  return apiRequest<{ id: string }>(`/podcasts/shows/${showId}/episodes`, {
    method: "POST",
    body,
  });
}

/** Browsers often omit MIME on .mp3 — infer from extension when needed. */
export function resolvePodcastAudioMime(file: File): string {
  const type = file.type?.trim() ?? ""
  if (
    type &&
    (type.startsWith("audio/") || type === "application/octet-stream")
  ) {
    return type
  }
  const ext = file.name.split(".").pop()?.toLowerCase()
  const byExt: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    aac: "audio/aac",
    flac: "audio/flac",
    webm: "audio/webm",
  }
  return (ext && byExt[ext]) || "audio/mpeg"
}

export type PodcastUploadInit = {
  episodeId: string;
  objectKey: string;
  uploadUrl: string;
  uploadMethod: "PUT" | "POST";
  uploadHeaders: Record<string, string>;
  expiresIn: number;
  publicUrl: string;
};

type CoverUploadInit = {
  showId: string;
  objectKey: string;
  uploadUrl: string;
  uploadMethod: "PUT" | "POST";
  uploadHeaders: Record<string, string>;
  expiresIn: number;
  publicUrl: string;
};

export function initPodcastEpisodeUpload(episodeId: string, file: File) {
  return apiRequest<PodcastUploadInit>(
    `/podcasts/episodes/${episodeId}/upload/init`,
    {
      method: "POST",
      body: {
        mimeType: resolvePodcastAudioMime(file),
        fileName: file.name,
      },
    },
  );
}

async function uploadMultipartFile(
  init: { uploadUrl: string; objectKey: string },
  file: File,
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  form.append("objectKey", init.objectKey);
  const token = loadStoredAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(init.uploadUrl, {
    method: "POST",
    credentials: "include",
    headers,
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed (${res.status})`);
  }
}

export async function uploadPodcastAudio(
  init: PodcastUploadInit,
  file: File,
): Promise<void> {
  if (init.uploadMethod === "PUT") {
    const res = await fetch(init.uploadUrl, {
      method: "PUT",
      headers: init.uploadHeaders,
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return;
  }

  await uploadMultipartFile(init, file);
}

export function completePodcastEpisodeUpload(
  episodeId: string,
  objectKey: string,
) {
  return apiRequest<{
    episodeId: string;
    status: string;
    audioUrl: string;
    durationSeconds: number;
  }>(`/podcasts/episodes/${episodeId}/upload/complete`, {
    method: "POST",
    body: { objectKey },
  });
}

export async function uploadPodcastShowCover(
  showId: string,
  file: File,
): Promise<string> {
  const mimeType = file.type?.trim().startsWith("image/")
    ? file.type
    : "image/jpeg";
  const init = await apiRequest<CoverUploadInit>(
    `/podcasts/shows/${showId}/cover/upload/init`,
    {
      method: "POST",
      body: { mimeType, fileName: file.name },
    },
  );

  if (init.uploadMethod === "PUT") {
    const res = await fetch(init.uploadUrl, {
      method: "PUT",
      headers: init.uploadHeaders,
      body: file,
    });
    if (!res.ok) throw new Error(`Cover upload failed (${res.status})`);
  } else {
    await uploadMultipartFile(init, file);
  }

  const done = await apiRequest<{ showId: string; coverUrl: string }>(
    `/podcasts/shows/${showId}/cover/upload/complete`,
    { method: "POST", body: { objectKey: init.objectKey } },
  );
  return done.coverUrl;
}

export async function uploadPodcastEpisodeFlow(
  showId: string,
  title: string,
  file: File,
  description?: string,
): Promise<{ episodeId: string; audioUrl: string }> {
  const episode = await createPodcastEpisode(showId, {
    title,
    description,
  });
  const init = await initPodcastEpisodeUpload(episode.id, file);
  await uploadPodcastAudio(init, file);
  const done = await completePodcastEpisodeUpload(episode.id, init.objectKey);
  return { episodeId: done.episodeId, audioUrl: done.audioUrl };
}
