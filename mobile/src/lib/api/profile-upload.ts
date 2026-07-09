import { Platform } from 'react-native';
import { apiRequest, loadStoredAccessToken } from './client';

export type FileUploadInit = {
  objectKey: string;
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  uploadHeaders: Record<string, string>;
  expiresIn: number;
  publicUrl: string;
};

export type ProfileUploadInit = FileUploadInit & {
  kind: 'avatar' | 'banner' | 'streamer_id';
};

export function initAvatarUpload(mimeType: string, fileName: string) {
  return apiRequest<ProfileUploadInit>('/users/me/avatar/upload', {
    method: 'POST',
    body: { mimeType, fileName },
  });
}

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

async function formDataFilePart(file: PickedFile): Promise<Blob | File> {
  const mime = file.mimeType || 'image/jpeg';
  const name = file.name || 'upload.jpg';

  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    if (typeof File !== 'undefined') {
      return new File([blob], name, { type: mime });
    }
    return blob;
  }

  return { uri: file.uri, name, type: mime } as unknown as Blob;
}

export async function uploadPickedFile(
  init: FileUploadInit,
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
  form.append('file', await formDataFilePart(file));
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
