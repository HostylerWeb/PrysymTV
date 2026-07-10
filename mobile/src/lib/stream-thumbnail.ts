import { Platform } from 'react-native';
import { apiRequest, loadStoredAccessToken } from './client';

type ThumbnailUploadInit = {
  objectKey: string;
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  uploadHeaders: Record<string, string>;
  publicUrl: string;
};

async function blobFromBase64(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function uploadStreamThumbnailFromBase64(
  streamId: string,
  base64DataUrl: string,
): Promise<string> {
  const blob = await blobFromBase64(base64DataUrl);
  const init = await apiRequest<ThumbnailUploadInit>(
    `/streams/${encodeURIComponent(streamId)}/thumbnail/upload`,
    { method: 'POST' },
  );

  if (init.uploadMethod === 'PUT') {
    const res = await fetch(init.uploadUrl, {
      method: 'PUT',
      headers: init.uploadHeaders,
      body: blob,
    });
    if (!res.ok) throw new Error(`Thumbnail upload failed (${res.status})`);
  } else {
    const form = new FormData();
    if (Platform.OS === 'web') {
      form.append('file', blob, 'thumbnail.jpg');
    } else {
      form.append('file', {
        uri: base64DataUrl,
        type: 'image/jpeg',
        name: 'thumbnail.jpg',
      } as unknown as Blob);
    }
    form.append('objectKey', init.objectKey);
    form.append('streamId', streamId);
    const token = loadStoredAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(init.uploadUrl, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Thumbnail upload failed (${res.status})`);
    }
  }

  const confirmed = await apiRequest<{ thumbnailUrl: string }>(
    `/streams/${encodeURIComponent(streamId)}/thumbnail/confirm`,
    { method: 'POST' },
  );
  return confirmed.thumbnailUrl;
}

const uploaded = new Set<string>();

export async function uploadStreamThumbnailOnce(
  streamId: string,
  base64DataUrl: string,
): Promise<void> {
  if (uploaded.has(streamId)) return;
  try {
    await uploadStreamThumbnailFromBase64(streamId, base64DataUrl);
    uploaded.add(streamId);
  } catch {
    /* non-fatal */
  }
}
