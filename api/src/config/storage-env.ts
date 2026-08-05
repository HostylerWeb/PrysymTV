import { ConfigService } from '@nestjs/config';

export type StorageDriver = 'local' | 's3';

export interface StorageSettings {
  driver: StorageDriver;
  rawKeyPrefix: string;
  hlsKeyPrefix: string;
  thumbnailKeyPrefix: string;
  rawKeyPattern: string;
  presignExpiresSeconds: number;
  maxUploadBytes: number;
  allowedMimePrefixes: string[];
  s3?: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBaseUrl: string;
  };
  local?: {
    root: string;
    publicBaseUrl: string;
  };
  apiPublicUrl: string;
}

export function getStorageSettings(config: ConfigService): StorageSettings {
  const driver = (config.get<string>('STORAGE_DRIVER') ?? 'local') as StorageDriver;
  const allowedMimePrefixes = (config.get<string>('UPLOAD_ALLOWED_MIME_PREFIXES') ?? 'video/,audio/')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const base: StorageSettings = {
    driver,
    rawKeyPrefix: config.get<string>('STORAGE_RAW_KEY_PREFIX') ?? 'uploads/raw',
    hlsKeyPrefix: config.get<string>('STORAGE_HLS_KEY_PREFIX') ?? 'uploads/hls',
    thumbnailKeyPrefix:
      config.get<string>('STORAGE_THUMBNAIL_KEY_PREFIX') ?? 'uploads/thumbnails',
    rawKeyPattern:
      config.get<string>('STORAGE_RAW_KEY_PATTERN') ?? '{videoId}/source{extension}',
    presignExpiresSeconds: Number(config.get<string>('STORAGE_PRESIGN_EXPIRES_SECONDS') ?? 3600),
    maxUploadBytes: Number(config.get<string>('UPLOAD_MAX_BYTES') ?? String(10 * 1024 ** 3)),
    allowedMimePrefixes,
    apiPublicUrl: config.getOrThrow<string>('API_PUBLIC_URL'),
  };

  if (driver === 's3') {
    base.s3 = {
      endpoint: config.getOrThrow<string>('S3_ENDPOINT'),
      region: config.get<string>('S3_REGION') ?? 'auto',
      bucket: config.getOrThrow<string>('S3_BUCKET'),
      accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      publicBaseUrl: config.getOrThrow<string>('S3_PUBLIC_BASE_URL'),
    };
  } else {
    base.local = {
      root: config.getOrThrow<string>('LOCAL_STORAGE_ROOT'),
      publicBaseUrl: config.getOrThrow<string>('LOCAL_STORAGE_PUBLIC_BASE_URL'),
    };
  }

  return base;
}

export function getVideoProcessingSettings(config: ConfigService) {
  const ffmpegPath = config.get<string>('FFMPEG_PATH') ?? 'ffmpeg';
  const ffprobeExplicit = config.get<string>('FFPROBE_PATH')?.trim();
  const ffprobePath =
    ffprobeExplicit ||
    (ffmpegPath.toLowerCase().endsWith('ffmpeg')
      ? ffmpegPath.replace(/ffmpeg$/i, 'ffprobe')
      : 'ffprobe');

  return {
    mode: (config.get<string>('VIDEO_PROCESSING_MODE') ?? 'skip') as 'skip' | 'ffmpeg',
    maxRetries: Number(config.get<string>('VIDEO_PROCESSING_MAX_RETRIES') ?? '3'),
    ffmpegPath,
    ffprobePath,
    tmpDir: config.get<string>('VIDEO_PROCESSING_TMP_DIR') ?? '',
    queueName: config.get<string>('VIDEO_PROCESSING_QUEUE_NAME') ?? 'video-processing',
  };
}

export function resolveObjectKey(
  pattern: string,
  prefix: string,
  vars: { videoId: string; extension: string },
): string {
  const body = pattern
    .replace(/\{videoId\}/g, vars.videoId)
    .replace(/\{extension\}/g, vars.extension);
  const prefixNorm = prefix.replace(/^\/+|\/+$/g, '');
  const bodyNorm = body.replace(/^\/+/, '');
  return prefixNorm ? `${prefixNorm}/${bodyNorm}` : bodyNorm;
}
