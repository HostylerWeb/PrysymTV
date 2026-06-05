import { apiRequest, loadStoredAccessToken } from "@/lib/api-client";

export type ProfileUploadInit = {
  objectKey: string;
  uploadUrl: string;
  uploadMethod: "PUT" | "POST";
  uploadHeaders: Record<string, string>;
  expiresIn: number;
  publicUrl: string;
  kind: "avatar" | "banner" | "streamer_id";
};

export function initAvatarUpload(file: File) {
  return apiRequest<ProfileUploadInit>("/users/me/avatar/upload", {
    method: "POST",
    body: {
      mimeType: file.type || "image/jpeg",
      fileName: file.name,
    },
  });
}

export function initBannerUpload(file: File) {
  return apiRequest<ProfileUploadInit>("/users/me/banner/upload", {
    method: "POST",
    body: {
      mimeType: file.type || "image/jpeg",
      fileName: file.name,
    },
  });
}

export function initStreamerIdUpload(file: File) {
  return apiRequest<ProfileUploadInit>("/users/me/streamer-id/upload", {
    method: "POST",
    body: {
      mimeType: file.type || "image/jpeg",
      fileName: file.name,
    },
  });
}

export async function uploadProfileImage(
  init: ProfileUploadInit,
  file: File,
): Promise<string> {
  if (init.uploadMethod === "PUT") {
    const res = await fetch(init.uploadUrl, {
      method: "PUT",
      headers: init.uploadHeaders,
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return init.publicUrl;
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
  const data = (await res.json()) as { publicUrl: string };
  return data.publicUrl;
}
