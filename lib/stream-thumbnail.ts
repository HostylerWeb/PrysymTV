import { apiRequest, loadStoredAccessToken } from "@/lib/api-client";

type ThumbnailUploadInit = {
  objectKey: string;
  uploadUrl: string;
  uploadMethod: "PUT" | "POST";
  uploadHeaders: Record<string, string>;
  publicUrl: string;
};

export async function captureVideoFrameBlob(
  video: HTMLVideoElement,
  quality = 0.85,
): Promise<Blob> {
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not capture video frame");
  ctx.drawImage(video, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Thumbnail capture failed"))),
      "image/jpeg",
      quality,
    );
  });
}

export async function uploadStreamThumbnail(
  streamId: string,
  image: Blob,
): Promise<string> {
  const init = await apiRequest<ThumbnailUploadInit>(
    `/streams/${encodeURIComponent(streamId)}/thumbnail/upload`,
    { method: "POST" },
  );

  if (init.uploadMethod === "PUT") {
    const res = await fetch(init.uploadUrl, {
      method: "PUT",
      headers: init.uploadHeaders,
      body: image,
    });
    if (!res.ok) throw new Error(`Thumbnail upload failed (${res.status})`);
  } else {
    const form = new FormData();
    form.append("file", image, "thumbnail.jpg");
    form.append("objectKey", init.objectKey);
    form.append("streamId", streamId);
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
      throw new Error(text || `Thumbnail upload failed (${res.status})`);
    }
  }

  const confirmed = await apiRequest<{ thumbnailUrl: string }>(
    `/streams/${encodeURIComponent(streamId)}/thumbnail/confirm`,
    { method: "POST" },
  );
  return confirmed.thumbnailUrl;
}

let lastUploadedStreamId: string | null = null;

/** Capture a camera preview frame and persist it as the stream thumbnail (once per stream). */
export async function captureAndUploadStreamThumbnail(
  streamId: string,
  video: HTMLVideoElement,
): Promise<void> {
  if (lastUploadedStreamId === streamId) return;
  if (!video.videoWidth || !video.videoHeight) return;
  try {
    const blob = await captureVideoFrameBlob(video);
    await uploadStreamThumbnail(streamId, blob);
    lastUploadedStreamId = streamId;
  } catch {
    /* non-fatal — avatar fallback still works */
  }
}
