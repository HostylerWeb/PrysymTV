import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { copyFile, mkdir, rm, stat, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { dirname, join, resolve } from 'path';
import { pipeline } from 'stream/promises';
import {
  getStorageSettings,
  resolveObjectKey,
  type StorageSettings,
} from '../config/storage-env';
import type { UploadTarget } from './storage.types';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private settings!: StorageSettings;
  private s3: S3Client | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.settings = getStorageSettings(this.config);
    if (this.settings.driver === 's3' && this.settings.s3) {
      const { endpoint, region, accessKeyId, secretAccessKey } = this.settings.s3;
      this.s3 = new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.logger.log(`Storage: S3-compatible (${endpoint})`);
    } else if (this.settings.local) {
      const root = resolve(this.settings.local.root);
      mkdirSync(root, { recursive: true });
      this.logger.log(`Storage: local (${root})`);
    }
  }

  getSettings(): StorageSettings {
    return this.settings;
  }

  extensionFromFileName(fileName?: string): string {
    if (!fileName?.includes('.')) return '';
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    return ext.length <= 12 ? ext : '';
  }

  buildRawKey(videoId: string, fileName?: string): string {
    const extension = this.extensionFromFileName(fileName);
    return resolveObjectKey(this.settings.rawKeyPattern, this.settings.rawKeyPrefix, {
      videoId,
      extension,
    });
  }

  buildHlsMasterKey(videoId: string): string {
    const prefix = this.settings.hlsKeyPrefix.replace(/^\/+|\/+$/g, '');
    return `${prefix}/${videoId}/master.m3u8`;
  }

  buildHlsPrefix(videoId: string): string {
    return this.buildHlsMasterKey(videoId).replace(/\/master\.m3u8$/, '');
  }

  buildThumbnailKey(videoId: string): string {
    const prefix = this.settings.thumbnailKeyPrefix.replace(/^\/+|\/+$/g, '');
    return `${prefix}/${videoId}.jpg`;
  }

  assertMimeAllowed(mimeType: string): void {
    const ok = this.settings.allowedMimePrefixes.some((prefix) =>
      mimeType.startsWith(prefix),
    );
    if (!ok) {
      throw new BadRequestException(
        `MIME type not allowed. Allowed prefixes: ${this.settings.allowedMimePrefixes.join(', ')}`,
      );
    }
  }

  assertImageMime(mimeType: string): void {
    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }
  }

  assertAudioMime(mimeType: string): void {
    if (
      !mimeType.startsWith('audio/') &&
      mimeType !== 'application/octet-stream'
    ) {
      throw new BadRequestException(
        'Only audio uploads are allowed (audio/* or application/octet-stream)',
      );
    }
  }

  buildPodcastAudioKey(episodeId: string, fileName?: string): string {
    const extension = this.extensionFromFileName(fileName) || '.mp3';
    return `uploads/podcasts/${episodeId}${extension}`;
  }

  buildAdMediaKey(fileName?: string): string {
    const extension = this.extensionFromFileName(fileName) || '';
    return `uploads/ads/${randomUUID()}${extension}`;
  }

  assertAdMediaMime(mimeType: string): void {
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
      throw new BadRequestException('Only image or video uploads are allowed');
    }
  }

  async createAdMediaUploadTarget(
    mimeType: string,
    fileName?: string,
  ): Promise<UploadTarget> {
    this.assertAdMediaMime(mimeType);
    const objectKey = this.buildAdMediaKey(fileName);
    const key = objectKey.replace(/^\/+/, '');
    const expiresIn = this.settings.presignExpiresSeconds;

    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const command = new PutObjectCommand({
        Bucket: this.settings.s3.bucket,
        Key: key,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });
      return {
        objectKey: key,
        uploadUrl,
        uploadMethod: 'PUT',
        uploadHeaders: { 'Content-Type': mimeType },
        expiresIn,
      };
    }

    await mkdir(dirname(this.getLocalAbsolutePath(key)), { recursive: true });
    const base = this.settings.apiPublicUrl.replace(/\/$/, '');
    return {
      objectKey: key,
      uploadUrl: `${base}/media/ad-upload`,
      uploadMethod: 'POST',
      uploadHeaders: {},
      expiresIn,
    };
  }

  /** Profile images, podcast show art, etc. */
  async createUploadTargetForKey(
    objectKey: string,
    mimeType: string,
  ): Promise<UploadTarget> {
    this.assertImageMime(mimeType);
    const key = objectKey.replace(/^\/+/, '');
    const expiresIn = this.settings.presignExpiresSeconds;

    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const command = new PutObjectCommand({
        Bucket: this.settings.s3.bucket,
        Key: key,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });
      return {
        objectKey: key,
        uploadUrl,
        uploadMethod: 'PUT',
        uploadHeaders: { 'Content-Type': mimeType },
        expiresIn,
      };
    }

    await mkdir(dirname(this.getLocalAbsolutePath(key)), { recursive: true });
    const base = this.settings.apiPublicUrl.replace(/\/$/, '');
    return {
      objectKey: key,
      uploadUrl: `${base}/media/profile-upload`,
      uploadMethod: 'POST',
      uploadHeaders: {},
      expiresIn,
    };
  }

  buildPodcastShowCoverKey(showId: string, fileName?: string): string {
    const extension = this.extensionFromFileName(fileName) || '.jpg';
    return `uploads/podcasts/shows/${showId}/cover${extension}`;
  }

  /** Podcast episode audio files. */
  async createAudioUploadTargetForKey(
    objectKey: string,
    mimeType: string,
  ): Promise<UploadTarget> {
    this.assertAudioMime(mimeType);
    const key = objectKey.replace(/^\/+/, '');
    const expiresIn = this.settings.presignExpiresSeconds;

    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const command = new PutObjectCommand({
        Bucket: this.settings.s3.bucket,
        Key: key,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });
      return {
        objectKey: key,
        uploadUrl,
        uploadMethod: 'PUT',
        uploadHeaders: { 'Content-Type': mimeType },
        expiresIn,
      };
    }

    await mkdir(dirname(this.getLocalAbsolutePath(key)), { recursive: true });
    const base = this.settings.apiPublicUrl.replace(/\/$/, '');
    return {
      objectKey: key,
      uploadUrl: `${base}/media/podcast-upload`,
      uploadMethod: 'POST',
      uploadHeaders: {},
      expiresIn,
    };
  }

  getPublicUrl(objectKey: string): string {
    const key = objectKey.replace(/^\/+/, '');
    if (this.settings.driver === 's3' && this.settings.s3) {
      const base = this.settings.s3.publicBaseUrl.replace(/\/$/, '');
      return `${base}/${key}`;
    }
    if (this.settings.local) {
      const base = this.settings.local.publicBaseUrl.replace(/\/$/, '');
      return `${base}/${key}`;
    }
    throw new Error('Storage not configured');
  }

  getLocalAbsolutePath(objectKey: string): string {
    if (!this.settings.local) {
      throw new Error('Local storage is not configured');
    }
    return join(resolve(this.settings.local.root), objectKey);
  }

  async createUploadTarget(
    videoId: string,
    mimeType: string,
    fileName?: string,
  ): Promise<UploadTarget> {
    this.assertMimeAllowed(mimeType);
    const objectKey = this.buildRawKey(videoId, fileName);
    const expiresIn = this.settings.presignExpiresSeconds;

    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const command = new PutObjectCommand({
        Bucket: this.settings.s3.bucket,
        Key: objectKey,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });
      return {
        objectKey,
        uploadUrl,
        uploadMethod: 'PUT',
        uploadHeaders: { 'Content-Type': mimeType },
        expiresIn,
      };
    }

    const base = this.settings.apiPublicUrl.replace(/\/$/, '');
    const uploadUrl = `${base}/media/upload/${videoId}`;
    await mkdir(dirname(this.getLocalAbsolutePath(objectKey)), { recursive: true });
    return {
      objectKey,
      uploadUrl,
      uploadMethod: 'POST',
      uploadHeaders: {},
      expiresIn,
    };
  }

  async writeLocalRaw(videoId: string, objectKey: string, data: Buffer): Promise<void> {
    const abs = this.getLocalAbsolutePath(objectKey);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, data);
    this.logger.debug(`Wrote local raw upload for video ${videoId}`);
  }

  async objectExists(objectKey: string): Promise<boolean> {
    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      try {
        await this.s3.send(
          new HeadObjectCommand({
            Bucket: this.settings.s3.bucket,
            Key: objectKey,
          }),
        );
        return true;
      } catch {
        return false;
      }
    }
    return existsSync(this.getLocalAbsolutePath(objectKey));
  }

  async getObjectSize(objectKey: string): Promise<number> {
    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const head = await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.settings.s3.bucket,
          Key: objectKey,
        }),
      );
      return head.ContentLength ?? 0;
    }
    const st = await stat(this.getLocalAbsolutePath(objectKey));
    return st.size;
  }

  async downloadToFile(objectKey: string, destPath: string): Promise<void> {
    await mkdir(dirname(destPath), { recursive: true });
    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const res = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.settings.s3.bucket,
          Key: objectKey,
        }),
      );
      if (!res.Body) throw new Error('Empty object body');
      await pipeline(res.Body as NodeJS.ReadableStream, createWriteStream(destPath));
      return;
    }
    const src = this.getLocalAbsolutePath(objectKey);
    await pipeline(createReadStream(src), createWriteStream(destPath));
  }

  async uploadFromFile(
    objectKey: string,
    localPath: string,
    contentType: string,
  ): Promise<void> {
    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const { readFile } = await import('fs/promises');
      const body = await readFile(localPath);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.settings.s3.bucket,
          Key: objectKey,
          Body: body,
          ContentType: contentType,
        }),
      );
      return;
    }
    const dest = this.getLocalAbsolutePath(objectKey);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(localPath, dest);
  }

  async deleteObject(objectKey: string): Promise<void> {
    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.settings.s3.bucket,
          Key: objectKey,
        }),
      );
      return;
    }
    const abs = this.getLocalAbsolutePath(objectKey);
    if (existsSync(abs)) await unlink(abs);
  }

  /** Map a stored public URL back to an object key when it belongs to this bucket. */
  objectKeyFromPublicUrl(publicUrl: string | null | undefined): string | null {
    if (!publicUrl?.trim()) return null;
    const trimmed = publicUrl.trim();
    const bases: string[] = [];
    if (this.settings.s3?.publicBaseUrl) {
      bases.push(this.settings.s3.publicBaseUrl.replace(/\/$/, ''));
    }
    if (this.settings.local?.publicBaseUrl) {
      bases.push(this.settings.local.publicBaseUrl.replace(/\/$/, ''));
    }
    for (const base of bases) {
      if (trimmed === base || trimmed.startsWith(`${base}/`)) {
        return trimmed.slice(base.length + 1).replace(/^\/+/, '');
      }
    }
    return null;
  }

  async deleteObjectIfExists(objectKey: string): Promise<void> {
    const key = objectKey.replace(/^\/+/, '');
    try {
      if (await this.objectExists(key)) {
        await this.deleteObject(key);
      }
    } catch (err) {
      this.logger.warn(
        `Could not delete object ${key}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /** Delete all objects under a prefix (HLS folders, show covers, etc.). */
  async deletePrefix(prefix: string): Promise<void> {
    const normalized = prefix.replace(/^\/+|\/+$/g, '');
    if (!normalized) return;

    if (this.settings.driver === 's3' && this.s3 && this.settings.s3) {
      const bucket = this.settings.s3.bucket;
      let continuationToken: string | undefined;
      do {
        const list = await this.s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `${normalized}/`,
            ContinuationToken: continuationToken,
          }),
        );
        const objects =
          list.Contents?.filter((o) => o.Key).map((o) => ({ Key: o.Key! })) ??
          [];
        if (objects.length > 0) {
          await this.s3.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: objects },
            }),
          );
        }
        continuationToken = list.NextContinuationToken;
      } while (continuationToken);
      return;
    }

    if (this.settings.local) {
      const abs = this.getLocalAbsolutePath(normalized);
      if (existsSync(abs)) {
        await rm(abs, { recursive: true, force: true });
      }
    }
  }

  /** Remove HLS package, thumbnail, and raw upload for a video row. */
  async purgeVideoAssets(video: {
    id: string;
    rawObjectKey?: string | null;
    hlsMasterUrl?: string | null;
    thumbnailUrl?: string | null;
  }): Promise<void> {
    await this.deletePrefix(this.buildHlsPrefix(video.id));
    await this.deleteObjectIfExists(this.buildThumbnailKey(video.id));
    if (video.rawObjectKey) {
      await this.deleteObjectIfExists(video.rawObjectKey);
    }

    const hlsKey = this.objectKeyFromPublicUrl(video.hlsMasterUrl);
    if (hlsKey?.endsWith('.m3u8')) {
      const prefix = hlsKey.replace(/\/[^/]+\.m3u8$/, '');
      if (prefix !== this.buildHlsPrefix(video.id)) {
        await this.deletePrefix(prefix);
      }
    } else if (hlsKey) {
      await this.deleteObjectIfExists(hlsKey);
    }

    const thumbKey = this.objectKeyFromPublicUrl(video.thumbnailUrl);
    if (thumbKey && thumbKey !== this.buildThumbnailKey(video.id)) {
      await this.deleteObjectIfExists(thumbKey);
    }
  }

  async purgePublicMediaUrl(
    publicUrl: string | null | undefined,
  ): Promise<void> {
    const key = this.objectKeyFromPublicUrl(publicUrl);
    if (!key) return;
    if (key.endsWith('.m3u8')) {
      await this.deletePrefix(key.replace(/\/[^/]+\.m3u8$/, ''));
      return;
    }
    await this.deleteObjectIfExists(key);
  }

  async purgePodcastEpisodeAssets(episode: {
    id: string;
    audioUrl?: string | null;
    coverUrl?: string | null;
  }): Promise<void> {
    await this.purgePublicMediaUrl(episode.audioUrl);
    await this.purgePublicMediaUrl(episode.coverUrl);
    await this.deletePrefix(`uploads/podcasts/${episode.id}`);
  }

  async purgePodcastShowAssets(show: {
    id: string;
    coverUrl?: string | null;
  }): Promise<void> {
    await this.purgePublicMediaUrl(show.coverUrl);
    await this.deletePrefix(`uploads/podcasts/shows/${show.id}`);
  }

  /** @deprecated Use getObjectSize — kept for local uploads */
  async getLocalFileSize(objectKey: string): Promise<number> {
    return this.getObjectSize(objectKey);
  }
}
