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

async function uploadWithProgress(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: Blob | FormData,
  onProgress?: (percent: number) => void,
): Promise<string | void> {
  return new Promise<string | void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(xhr.responseText || undefined);
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open(method, url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.send(body);
  });
}

export async function uploadPickedFile(
  init: FileUploadInit,
  file: PickedFile,
  options?: { onProgress?: (percent: number) => void },
): Promise<string> {
  const mime = file.mimeType || 'image/jpeg';
  options?.onProgress?.(0);

  if (init.uploadMethod === 'PUT') {
    const blob = await (await fetch(file.uri)).blob();
    await uploadWithProgress(
      init.uploadUrl,
      'PUT',
      { ...init.uploadHeaders, 'Content-Type': mime },
      blob,
      options?.onProgress,
    );
    return init.publicUrl;
  }

  const form = new FormData();
  form.append('file', await formDataFilePart(file));
  form.append('objectKey', init.objectKey);
  const token = await loadStoredAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const responseText = await uploadWithProgress(
    init.uploadUrl,
    'POST',
    headers,
    form,
    options?.onProgress,
  );
  if (responseText) {
    try {
      const data = JSON.parse(responseText) as { publicUrl: string };
      if (data.publicUrl) return data.publicUrl;
    } catch {
      /* fall through */
    }
  }
  return init.publicUrl;
}
