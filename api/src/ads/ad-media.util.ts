export type AdMediaKind = 'image' | 'video';

const VIDEO_EXT =
  /\.(mp4|webm|mov|m4v|ogg|ogv|m3u8|avi|mkv)(\?|$)/i;
const IMAGE_EXT =
  /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|heic|heif)(\?|$)/i;

export function inferAdMediaTypeFromUrl(mediaUrl: string): AdMediaKind {
  const path = mediaUrl.split('?')[0].trim().toLowerCase();
  if (VIDEO_EXT.test(path)) return 'video';
  if (IMAGE_EXT.test(path)) return 'image';
  return 'image';
}

export function inferAdMediaTypeFromMime(mimeType: string): AdMediaKind {
  const mime = mimeType.trim().toLowerCase();
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'image';
}

export function extensionFromAdMime(mimeType: string): string {
  const mime = mimeType.trim().toLowerCase();
  if (mime === 'video/mp4') return '.mp4';
  if (mime === 'video/webm') return '.webm';
  if (mime === 'video/quicktime') return '.mov';
  if (mime.startsWith('video/')) return '.mp4';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime.startsWith('image/')) return '.jpg';
  return '';
}

export function resolveAdMediaType(
  mediaUrl: string,
  stored?: AdMediaKind | null,
): AdMediaKind {
  if (stored === 'video' || stored === 'image') return stored;
  return inferAdMediaTypeFromUrl(mediaUrl);
}
