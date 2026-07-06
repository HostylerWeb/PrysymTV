import { apiRequest, loadStoredAccessToken } from './client';

export type ProfileUploadInit = {
  objectKey: string;
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  uploadHeaders: Record<string, string>;
  expiresIn: number;
  publicUrl: string;
  kind: 'avatar' | 'banner' | 'streamer_id';
};

export function initStreamerIdUpload(mimeType: string, fileName: string) {
  return apiRequest<ProfileUploadInit>('/users/me/streamer-id/upload', {
    method: 'POST',
    body: { mimeType, fileName },
  });
}

export function initBannerUpload(mimeType: string, fileName: string) {
  return apiRequest<ProfileUploadInit>('/users/me/banner/upload', {
    method: 'POST',
    body: { mimeType, fileName },
  });
}

type PickedFile = { uri: string; mimeType?: string | null; name?: string | null };

export async function uploadPickedFile(
  init: ProfileUploadInit,
  file: PickedFile,
): Promise<string> {
  const mime = file.mimeType || 'image/jpeg';
  const name = file.name || 'upload.jpg';

  if (init.uploadMethod === 'PUT') {
    const blob = await (await fetch(file.uri)).blob();
    const res = await fetch(init.uploadUrl, {
      method: 'PUT',
      headers: { ...init.uploadHeaders, 'Content-Type': mime },
      body: blob,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return init.publicUrl;
  }

  const form = new FormData();
  form.append('file', { uri: file.uri, name, type: mime } as unknown as Blob);
  form.append('objectKey', init.objectKey);
  const token = await loadStoredAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(init.uploadUrl, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { publicUrl: string };
  return data.publicUrl;
}
