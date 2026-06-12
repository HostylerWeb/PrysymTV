import { apiRequest, getApiBaseUrl, loadStoredAccessToken } from "@/lib/api-client";

export type UploadInitBody = {
  type: "short" | "video" | "podcast" | "movie";
  title: string;
  description?: string;
  category?: string;
  visibility?: "public" | "private" | "unlisted";
  tags?: string;
  mimeType: string;
  fileName?: string;
  releaseYear?: number;
  ageRating?: string;
  tagline?: string;
  director?: string;
  writers?: string;
  cast?: Array<{ name: string; role: string }>;
};

export type UploadInitResponse = {
  videoId: string;
  status: string;
  objectKey: string;
  uploadUrl: string;
  uploadMethod: "PUT" | "POST";
  uploadHeaders: Record<string, string>;
  maxUploadBytes: number;
  expiresIn: number;
};

export type UploadCompleteBody = {
  videoId: string;
  objectKey?: string;
};

export type UploadCompleteResponse = {
  videoId: string;
  status: string;
  message: string;
};

export type VideoDetail = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  hlsMasterUrl: string | null;
  playbackUrl: string | null;
  videoUrl: string | null;
  durationSeconds: number;
  viewsCount: number;
  likesCount: number;
  commentsCount?: number;
  type: string;
  status: string;
  category?: string | null;
  releaseYear?: number | null;
  ageRating?: string | null;
  tagline?: string | null;
  director?: string | null;
  writers?: string[];
  cast?: Array<{ name: string; role: string; imageUrl?: string | null }>;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export type UploadFlowResult = UploadCompleteResponse;

export async function initVideoUpload(body: UploadInitBody) {
  return apiRequest<UploadInitResponse>("/videos/upload/init", {
    method: "POST",
    body,
  });
}

export async function completeVideoUpload(body: UploadCompleteBody) {
  return apiRequest<UploadCompleteResponse>("/videos/upload/complete", {
    method: "POST",
    body,
  });
}

/** Upload bytes to the URL returned by init (presigned PUT or local multipart). */
export async function uploadVideoFile(
  init: UploadInitResponse,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const maxBytes = init.maxUploadBytes;
  if (file.size > maxBytes) {
    throw new Error(`File is too large (max ${maxBytes} bytes)`);
  }

  if (init.uploadMethod === "PUT") {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", init.uploadUrl);
      for (const [key, value] of Object.entries(init.uploadHeaders)) {
        xhr.setRequestHeader(key, value);
      }
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });
    return;
  }

  const form = new FormData();
  form.append("file", file);
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
  if (onProgress) onProgress(100);
}

export async function uploadVideoFlow(
  body: UploadInitBody,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadFlowResult> {
  const init = await initVideoUpload({
    ...body,
    mimeType: body.mimeType || file.type,
    fileName: body.fileName ?? file.name,
  });
  await uploadVideoFile(init, file, onProgress);
  return completeVideoUpload({
    videoId: init.videoId,
    objectKey: init.objectKey,
  });
}

export function fetchVideoDetail(id: string) {
  return apiRequest<VideoDetail>(`/videos/${id}`, { auth: false });
}

export async function pollVideoUntilReady(
  videoId: string,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    onStatus?: (status: string) => void;
  },
): Promise<VideoDetail> {
  const intervalMs = options?.intervalMs ?? 2500;
  const maxAttempts = options?.maxAttempts ?? 120;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const video = await fetchVideoDetail(videoId);
    options?.onStatus?.(video.status);
    if (video.status === "ready") return video;
    if (video.status === "failed") {
      throw new Error("Video processing failed. Try uploading again.");
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    "Processing is taking longer than expected. Your video will appear when ready.",
  );
}

export function getVideoUploadMaxBytes(): number | undefined {
  const raw = process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES;
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export { getApiBaseUrl };
