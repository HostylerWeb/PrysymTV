import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEMO_CAST_HOSTS = new Set(['commondatastorage.googleapis.com']);

@Injectable()
export class CastService {
  private readonly logger = new Logger(CastService.name);

  constructor(private readonly config: ConfigService) {}

  private getProxyBase(): string {
    const apiPublic = this.config
      .getOrThrow<string>('API_PUBLIC_URL')
      .replace(/\/$/, '');
    return `${apiPublic}/cast/proxy`;
  }

  private getAllowedHosts(): Set<string> {
    const hosts = new Set<string>(DEMO_CAST_HOSTS);

    const mediamtx = this.config.get<string>('MEDIAMTX_HLS_PUBLIC_URL')?.trim();
    if (mediamtx) {
      try {
        hosts.add(new URL(mediamtx).hostname);
      } catch {
        /* ignore */
      }
    }

    const frontend = this.config.get<string>('FRONTEND_URL')?.trim();
    if (frontend) {
      try {
        hosts.add(new URL(frontend).hostname);
      } catch {
        /* ignore */
      }
    }

    hosts.add('localhost');
    hosts.add('127.0.0.1');
    return hosts;
  }

  assertAllowedMediaUrl(rawUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid media URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Unsupported media URL scheme');
    }

    if (!this.getAllowedHosts().has(parsed.hostname)) {
      throw new ForbiddenException('Media URL is not allowed for casting');
    }

    return parsed;
  }

  private rewriteM3u8Playlist(body: string, sourceUrl: URL): string {
    const proxyBase = this.getProxyBase();
    const toProxy = (target: string) =>
      `${proxyBase}?url=${encodeURIComponent(target)}`;

    return body
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/gi, (_match, uri: string) => {
            const absolute = new URL(uri, sourceUrl).href;
            return `URI="${toProxy(absolute)}"`;
          });
        }

        const absolute = new URL(trimmed, sourceUrl).href;
        return toProxy(absolute);
      })
      .join('\n');
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
    return 'application/octet-stream';
  }

  async fetchForCast(rawUrl: string): Promise<{
    body: Buffer;
    contentType: string;
  }> {
    const sourceUrl = this.assertAllowedMediaUrl(rawUrl);

    const upstream = await fetch(sourceUrl.href, {
      headers: { Accept: '*/*' },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      this.logger.warn(
        `Cast proxy upstream ${upstream.status} for ${sourceUrl.href}`,
      );
      throw new BadRequestException('Upstream media could not be fetched');
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const path = sourceUrl.pathname;
    const upstreamType = upstream.headers.get('content-type');
    const isPlaylist =
      path.toLowerCase().endsWith('.m3u8') ||
      upstreamType?.includes('mpegurl') ||
      upstreamType?.includes('m3u8');

    if (isPlaylist) {
      const rewritten = this.rewriteM3u8Playlist(
        buffer.toString('utf8'),
        sourceUrl,
      );
      return {
        body: Buffer.from(rewritten, 'utf8'),
        contentType: 'application/vnd.apple.mpegurl',
      };
    }

    return {
      body: buffer,
      contentType: this.contentTypeFor(path, upstreamType),
    };
  }
}
