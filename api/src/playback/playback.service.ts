import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify } from 'jose';
import { StorageService } from '../storage/storage.service';
import type { VideoWithCreator } from '../common/mappers/content.mapper';

type PlaybackTokenPayload = {
  typ: 'playback';
  pfx: string;
};

@Injectable()
export class PlaybackService {
  private readonly logger = new Logger(PlaybackService.name);
  private readonly secret: Uint8Array;
  private readonly ttlSeconds: number;
  private readonly apiBase: string;

  constructor(
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {
    this.secret = new TextEncoder().encode(
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    );
    this.ttlSeconds = Number(
      this.config.get<string>('PLAYBACK_TOKEN_TTL_SECONDS') ?? 14_400,
    );
    this.apiBase = this.config
      .getOrThrow<string>('API_PUBLIC_URL')
      .replace(/\/$/, '');
  }

  private isExternalPlaybackUrl(stored: string | null | undefined): string | null {
    if (!stored?.trim() || !/^https?:\/\//i.test(stored.trim())) return null;
    if (this.storage.resolveMediaObjectKey(stored)) return null;
    return stored.trim();
  }

  private async signToken(prefix: string): Promise<string> {
    const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return new SignJWT({ typ: 'playback', pfx: normalized } satisfies PlaybackTokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .sign(this.secret);
  }

  private async verifyToken(token: string): Promise<PlaybackTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ['HS256'],
      });
      if (payload.typ !== 'playback' || typeof payload.pfx !== 'string') {
        throw new ForbiddenException('Invalid playback token');
      }
      return { typ: 'playback', pfx: payload.pfx };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new ForbiddenException('Playback link expired or invalid');
    }
  }

  private playbackBaseUrl(token: string, fileName: string): string {
    const encoded = encodeURIComponent(token);
    return `${this.apiBase}/playback/${encoded}/${fileName}`;
  }

  async buildPlaybackUrlsFromObjectKey(
    objectKey: string | null,
  ): Promise<{ playbackUrl: string | null; videoUrl: string | null }> {
    if (!objectKey?.trim()) {
      return { playbackUrl: null, videoUrl: null };
    }
    const key = objectKey.replace(/^\/+/, '');
    const fileName = key.split('/').pop();
    if (!fileName) {
      return { playbackUrl: null, videoUrl: null };
    }
    const prefix = key.slice(0, key.length - fileName.length);
    const token = await this.signToken(prefix);
    const url = this.playbackBaseUrl(token, fileName);
    return { playbackUrl: url, videoUrl: url };
  }

  async buildVideoPlaybackUrls(video: {
    id: string;
    hlsMasterUrl: string | null;
  }): Promise<{ playbackUrl: string | null; videoUrl: string | null }> {
    const external = this.isExternalPlaybackUrl(video.hlsMasterUrl);
    if (external) {
      return { playbackUrl: external, videoUrl: external };
    }
    const masterKey = this.storage.resolveVideoHlsMasterKey(
      video.hlsMasterUrl,
      video.id,
    );
    return this.buildPlaybackUrlsFromObjectKey(masterKey);
  }

  async buildStoredMediaPlaybackUrls(
    stored: string | null | undefined,
  ): Promise<{ playbackUrl: string | null; videoUrl: string | null; audioUrl?: string | null }> {
    const external = this.isExternalPlaybackUrl(stored);
    if (external) {
      return { playbackUrl: external, videoUrl: external, audioUrl: external };
    }
    const key = this.storage.resolveMediaObjectKey(stored);
    const urls = await this.buildPlaybackUrlsFromObjectKey(key);
    return { ...urls, audioUrl: urls.playbackUrl };
  }

  mapVideoCard(v: VideoWithCreator) {
    return {
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      posterUrl: v.posterUrl,
      durationSeconds: v.durationSeconds,
      viewsCount: v.viewsCount,
      likesCount: v.likesCount,
      commentsCount: v.commentsCount,
      type: v.type,
      category: v.category,
      vertical: v.vertical,
      releaseYear: v.releaseYear,
      ageRating: v.ageRating,
      tagline: v.tagline,
      channel: v.creator.displayName ?? v.creator.username,
      channelSlug: v.creator.username,
      creatorId: v.creator.id,
      playbackUrl: null as string | null,
      videoUrl: null as string | null,
    };
  }

  async mapVideoCardWithPlayback(v: VideoWithCreator) {
    const card = this.mapVideoCard(v);
    const urls = await this.buildVideoPlaybackUrls(v);
    return { ...card, ...urls };
  }

  async mapVideoCardsWithPlayback(items: VideoWithCreator[]) {
    return Promise.all(items.map((item) => this.mapVideoCardWithPlayback(item)));
  }

  private contentTypeFor(pathname: string, upstream: string | null): string {
    const fromHeader = upstream?.split(';')[0]?.trim();
    if (fromHeader) return fromHeader;
    const lower = pathname.toLowerCase();
    if (lower.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.ts')) return 'video/mp2t';
    if (lower.endsWith('.m4s')) return 'video/iso.segment';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.m4a')) return 'audio/mp4';
    if (lower.endsWith('.aac')) return 'audio/aac';
    return 'application/octet-stream';
  }

  private rewriteM3u8Playlist(
    body: string,
    token: string,
    playlistRelPath: string,
  ): string {
    const sourceUrl = new URL(
      playlistRelPath,
      `${this.apiBase}/playback/${encodeURIComponent(token)}/`,
    );
    const tokenPath = encodeURIComponent(token);
    const toPlayback = (target: string) => {
      const absolute = new URL(target, sourceUrl);
      const rel = absolute.pathname.replace(
        new RegExp(
          `^/api/v1/playback/${tokenPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?`,
        ),
        '',
      );
      return this.playbackBaseUrl(token, decodeURIComponent(rel));
    };

    return body
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/gi, (_match, uri: string) => {
            return `URI="${toPlayback(uri)}"`;
          });
        }
        return toPlayback(trimmed);
      })
      .join('\n');
  }

  private sanitizeRelativePath(relativePath: string): string {
    const normalized = relativePath.replace(/^\/+/, '').replace(/\\/g, '/');
    if (!normalized || normalized.includes('..')) {
      throw new BadRequestException('Invalid media path');
    }
    return normalized;
  }

  async streamTokenPath(
    token: string,
    relativePath: string,
  ): Promise<{ body: Buffer; contentType: string }> {
    const payload = await this.verifyToken(token);
    const rel = this.sanitizeRelativePath(relativePath);
    const objectKey = `${payload.pfx}${rel}`.replace(/\/{2,}/g, '/');

    let body: Buffer;
    let upstreamType: string | null;
    try {
      const fetched = await this.storage.getObjectBytes(objectKey);
      body = fetched.body;
      upstreamType = fetched.contentType;
    } catch (err) {
      this.logger.warn(
        `Playback fetch failed for ${objectKey}: ${err instanceof Error ? err.message : err}`,
      );
      throw new BadRequestException('Media segment not found');
    }

    const isPlaylist =
      rel.toLowerCase().endsWith('.m3u8') ||
      upstreamType?.includes('mpegurl') ||
      upstreamType?.includes('m3u8');

    if (isPlaylist) {
      const rewritten = this.rewriteM3u8Playlist(
        body.toString('utf8'),
        token,
        rel,
      );
      return {
        body: Buffer.from(rewritten, 'utf8'),
        contentType: 'application/vnd.apple.mpegurl',
      };
    }

    return {
      body,
      contentType: this.contentTypeFor(rel, upstreamType),
    };
  }
}
