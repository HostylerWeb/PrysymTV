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

export function createPodcastEpisode(
  showId: string,
  body: { title: string; description?: string; coverUrl?: string },
) {
  return apiRequest<{ id: string }>(`/podcasts/shows/${showId}/episodes`, {
    method: "POST",
    body,
  });
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

export function initPodcastEpisodeUpload(
  episodeId: string,
  file: File,
) {
  return apiRequest<PodcastUploadInit>(
    `/podcasts/episodes/${episodeId}/upload/init`,
    {
      method: "POST",
      body: {
        mimeType: file.type || "audio/mpeg",
        fileName: file.name,
      },
    },
  );
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
