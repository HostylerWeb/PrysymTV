import { apiRequest } from './client';
import { uploadPickedFile, type FileUploadInit } from './profile-upload';
import { createPodcastEpisode } from './podcasts';

export type PodcastUploadInit = FileUploadInit & {
  episodeId: string;
};

type PickedMedia = { uri: string; name?: string | null; mimeType?: string | null };

function resolvePodcastMediaMime(file: PickedMedia): string {
  const type = file.mimeType?.trim() ?? '';
  if (type.startsWith('video/')) return type;
  if (type.startsWith('audio/') || type === 'application/octet-stream') return type || 'audio/mpeg';
  const ext = (file.name ?? '').split('.').pop()?.toLowerCase();
  const byExt: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'video/webm',
  };
  return (ext && byExt[ext]) || 'audio/mpeg';
}

export function initPodcastEpisodeUpload(episodeId: string, file: PickedMedia) {
  return apiRequest<PodcastUploadInit>(`/podcasts/episodes/${episodeId}/upload/init`, {
    method: 'POST',
    body: {
      mimeType: resolvePodcastMediaMime(file),
      fileName: file.name ?? 'episode.mp3',
    },
  });
}

export function completePodcastEpisodeUpload(episodeId: string, objectKey: string) {
  return apiRequest<{
    episodeId: string;
    status: string;
    audioUrl: string | null;
    videoUrl?: string | null;
  }>(`/podcasts/episodes/${episodeId}/upload/complete`, {
    method: 'POST',
    body: { objectKey },
  });
}

export async function uploadPodcastEpisodeFlow(
  showId: string,
  title: string,
  file: PickedMedia,
  description?: string,
) {
  const episode = await createPodcastEpisode(showId, { title, description });
  const init = await initPodcastEpisodeUpload(episode.id, file);
  await uploadPickedFile(init, file);
  const done = await completePodcastEpisodeUpload(episode.id, init.objectKey);
  return {
    episodeId: done.episodeId,
    audioUrl: done.audioUrl,
    videoUrl: done.videoUrl ?? null,
  };
}

export async function uploadPodcastShowCover(
  showId: string,
  file: PickedMedia,
): Promise<string> {
  const mimeType = file.mimeType?.trim().startsWith('image/') ? file.mimeType! : 'image/jpeg';
  const init = await apiRequest<FileUploadInit & { showId: string }>(
    `/podcasts/shows/${showId}/cover/upload/init`,
    {
      method: 'POST',
      body: { mimeType, fileName: file.name ?? 'cover.jpg' },
    },
  );
  await uploadPickedFile(init, file);
  const done = await apiRequest<{ showId: string; coverUrl: string }>(
    `/podcasts/shows/${showId}/cover/upload/complete`,
    { method: 'POST', body: { objectKey: init.objectKey } },
  );
  return done.coverUrl;
}
