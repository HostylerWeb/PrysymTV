import { randomUUID } from 'crypto';
import * as net from 'node:net';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamStatus, StreamerStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { verticalFromCategorySlug } from '../common/utils/category-vertical.util';
import { StreamsGateway } from './streams.gateway';

type MediamtxAuthBody = {
  user?: string;
  password?: string;
  ip?: string;
  action?: string;
  path?: string;
  protocol?: string;
  id?: string;
  query?: string;
};

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly streamsGateway: StreamsGateway,
  ) {}

  async listLive() {
    await this.syncStreamsFromIngest();

    const items = await this.prisma.stream.findMany({
      where: { status: StreamStatus.live },
      orderBy: { viewerCount: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
    return {
      items: items.map((s) => this.mapStream(s)),
    };
  }

  async getOne(idOrSlug: string, viewerId?: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const include = {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
        },
      },
    } as const;

    let stream;
    if (isUuid) {
      stream = await this.prisma.stream.findFirst({
        where: { id: idOrSlug },
        include,
      });
    } else {
      const slug = idOrSlug.toLowerCase();
      stream = await this.prisma.stream.findFirst({
        where: { creator: { username: slug }, status: StreamStatus.live },
        orderBy: { startedAt: 'desc' },
        include,
      });
      if (!stream) {
        stream = await this.prisma.stream.findFirst({
          where: {
            creator: { username: slug },
            status: { in: [StreamStatus.scheduled, StreamStatus.ended] },
          },
          orderBy: { startedAt: 'desc' },
          include,
        });
      }
    }
    if (!stream) throw new NotFoundException('Stream not found');

    if (
      stream.temporaryStreamToken &&
      !stream.hlsPlaybackUrl &&
      stream.status !== StreamStatus.ended
    ) {
      await this.trySyncLiveFromHls(stream.temporaryStreamToken);
      const refreshed = await this.prisma.stream.findUnique({
        where: { id: stream.id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      });
      if (refreshed) return this.mapStream(refreshed, viewerId);
    }

    return this.mapStream(stream, viewerId);
  }

  /** When webhooks fail, promote scheduled streams that already have an HLS manifest. */
  /** Promote scheduled streams on air; end stale rows with no HLS manifest. */
  async syncStreamsFromIngest() {
    await this.syncScheduledStreamsFromIngest();

    const staleLive = await this.prisma.stream.findMany({
      where: {
        status: StreamStatus.live,
        temporaryStreamToken: { not: null },
      },
      select: { id: true, temporaryStreamToken: true },
    });
    for (const row of staleLive) {
      const key = row.temporaryStreamToken!;
      if (await this.hlsManifestAvailable(key)) continue;
      await this.prisma.stream.updateMany({
        where: { id: row.id, status: StreamStatus.live },
        data: {
          status: StreamStatus.ended,
          endedAt: new Date(),
          hlsPlaybackUrl: null,
        },
      });
      this.streamsGateway.emitStreamEnded(row.id);
      this.logger.log(`Stream ended (no HLS): ${key}`);
    }
  }

  async syncScheduledStreamsFromIngest() {
    const scheduled = await this.prisma.stream.findMany({
      where: {
        status: StreamStatus.scheduled,
        temporaryStreamToken: { not: null },
      },
      select: { temporaryStreamToken: true },
    });
    await Promise.all(
      scheduled.map((s) =>
        this.trySyncLiveFromHls(s.temporaryStreamToken!),
      ),
    );
  }

  /** Fallback when MediaMTX webhooks cannot reach the API (e.g. missing curl in container). */
  private async hlsManifestAvailable(streamKey: string): Promise<boolean> {
    const hlsBase = (
      this.config.get<string>('MEDIAMTX_HLS_PUBLIC_URL') ?? 'http://localhost:8888'
    ).replace(/\/$/, '');
    const manifest = `${hlsBase}/live/${streamKey}/index.m3u8`;
    try {
      const res = await fetch(manifest, {
        method: 'GET',
        signal: AbortSignal.timeout(2500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async trySyncLiveFromHls(streamKey: string) {
    if (!(await this.hlsManifestAvailable(streamKey))) return;
    await this.mediamtxReady(`live/${streamKey}`);
  }

  async ingestHealth() {
    const rtmpUrl =
      this.config.get<string>('RTMP_INGEST_URL') ?? 'rtmp://localhost:1935/live';
    const hlsBase = (
      this.config.get<string>('MEDIAMTX_HLS_PUBLIC_URL') ?? 'http://localhost:8888'
    ).replace(/\/$/, '');

    let rtmpReachable = false;
    try {
      const u = new URL(rtmpUrl.replace('rtmp://', 'http://'));
      const host = u.hostname === 'localhost' ? '127.0.0.1' : u.hostname;
      const port = Number(u.port || 1935);
      rtmpReachable = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({ host, port, timeout: 2000 });
        socket.once('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.once('error', () => resolve(false));
        socket.once('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });
    } catch {
      rtmpReachable = false;
    }

    return {
      rtmpUrl: rtmpUrl.replace(/\/$/, ''),
      hlsPublicUrl: hlsBase,
      rtmpReachable,
      mediamtxRequired: true,
      hint: rtmpReachable
        ? 'RTMP ingest is reachable. Use Server + Stream Key in OBS.'
        : 'Start the live stack: docker compose up -d mediamtx (from the project root). Then generate a new stream key.',
    };
  }

  async initStream(creatorId: string, title: string, category?: string) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { streamerStatus: true, isBanned: true },
    });
    if (!creator) throw new NotFoundException('User not found');
    if (creator.isBanned) {
      throw new ForbiddenException('Account cannot start streams');
    }
    if (creator.streamerStatus !== StreamerStatus.approved) {
      throw new ForbiddenException(
        'Only approved streamers can go live. Your application must be approved first.',
      );
    }

    const stream = await this.prisma.stream.create({
      data: {
        creatorId,
        title,
        category: category?.trim() || 'Live',
        vertical: verticalFromCategorySlug(category?.trim()) ?? undefined,
        status: StreamStatus.scheduled,
        temporaryStreamToken: `sk_${randomUUID().replace(/-/g, '')}`,
      },
    });
    const rtmpBase =
      this.config.get<string>('RTMP_INGEST_URL') ?? 'rtmp://localhost:1935/live';
    return {
      streamId: stream.id,
      streamKey: stream.temporaryStreamToken,
      rtmpUrl: rtmpBase.replace(/\/$/, ''),
      status: stream.status,
    };
  }

  /** MediaMTX HTTP auth — allow publish only with a valid stream key path. */
  async mediamtxAuth(body: MediamtxAuthBody) {
    const action = body.action ?? 'publish';
    const path = body.path ?? '';

    if (action === 'read' || action === 'playback') {
      return { allowed: true };
    }

    if (action !== 'publish') {
      return { allowed: false };
    }

    const streamKey = this.parseStreamKeyFromPath(path);
    if (!streamKey) return { allowed: false };

    const stream = await this.prisma.stream.findFirst({
      where: {
        temporaryStreamToken: streamKey,
        status: { in: [StreamStatus.scheduled, StreamStatus.live] },
      },
    });
    return { allowed: !!stream };
  }

  /** MediaMTX runOnReady — HLS is available; mark stream live. */
  async mediamtxReady(path: string) {
    const streamKey = this.parseStreamKeyFromPath(path);
    if (!streamKey) return { ok: false };

    const hlsBase = (
      this.config.get<string>('MEDIAMTX_HLS_PUBLIC_URL') ?? 'http://localhost:8888'
    ).replace(/\/$/, '');
    const hlsPlaybackUrl = `${hlsBase}/live/${streamKey}/index.m3u8`;

    const updated = await this.prisma.stream.updateMany({
      where: {
        temporaryStreamToken: streamKey,
        status: { in: [StreamStatus.scheduled, StreamStatus.live] },
      },
      data: {
        status: StreamStatus.live,
        hlsPlaybackUrl,
        startedAt: new Date(),
      },
    });

    if (updated.count > 0) {
      this.logger.log(`Stream live: ${streamKey} → ${hlsPlaybackUrl}`);
      const stream = await this.prisma.stream.findFirst({
        where: { temporaryStreamToken: streamKey },
        include: {
          creator: {
            select: { id: true, username: true, displayName: true },
          },
        },
      });
      if (stream) {
        const name = stream.creator.displayName ?? stream.creator.username;
        void this.notifications.notifyCreatorWentLive(
          stream.creatorId,
          stream.id,
          name,
        );
      }
    }
    return { ok: true, hlsPlaybackUrl };
  }

  /** MediaMTX runOnNotReady — publisher disconnected. */
  async mediamtxDone(path: string) {
    const streamKey = this.parseStreamKeyFromPath(path);
    if (!streamKey) return { ok: false };

    const stream = await this.prisma.stream.findFirst({
      where: { temporaryStreamToken: streamKey },
      select: { id: true },
    });

    const updated = await this.prisma.stream.updateMany({
      where: {
        temporaryStreamToken: streamKey,
        status: { in: [StreamStatus.live, StreamStatus.scheduled] },
      },
      data: {
        status: StreamStatus.ended,
        endedAt: new Date(),
        hlsPlaybackUrl: null,
      },
    });

    if (updated.count > 0 && stream) {
      this.streamsGateway.emitStreamEnded(stream.id);
    }

    this.logger.log(`Stream ended: ${streamKey}`);
    return { ok: true };
  }

  /** Creator ends their own broadcast (disconnects OBS + updates DB). */
  async endStream(streamId: string, userId: string) {
    const stream = await this.prisma.stream.findUnique({
      where: { id: streamId },
    });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.creatorId !== userId) {
      throw new ForbiddenException('Only the stream owner can end this broadcast');
    }
    if (stream.status === StreamStatus.ended) {
      throw new BadRequestException('Stream has already ended');
    }

    if (stream.temporaryStreamToken) {
      await this.kickMediamtxPublisher(`live/${stream.temporaryStreamToken}`);
    }

    await this.prisma.stream.update({
      where: { id: streamId },
      data: {
        status: StreamStatus.ended,
        endedAt: new Date(),
        hlsPlaybackUrl: null,
      },
    });

    this.streamsGateway.emitStreamEnded(streamId);
    this.logger.log(`Stream ended by creator: ${streamId}`);
    return { success: true, status: StreamStatus.ended };
  }

  private async kickMediamtxPublisher(path: string) {
    const apiBase = (
      this.config.get<string>('MEDIAMTX_API_URL') ?? 'http://localhost:9997'
    ).replace(/\/$/, '');
    const normalized = path.replace(/^\/+/, '');

    try {
      const listRes = await fetch(`${apiBase}/v3/rtmpconns/list`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!listRes.ok) return;

      const data = (await listRes.json()) as {
        items?: Array<{ id: string; path: string; state?: string }>;
      };

      for (const conn of data.items ?? []) {
        const connPath = conn.path.replace(/^\/+/, '');
        if (connPath !== normalized) continue;
        await fetch(`${apiBase}/v3/rtmpconns/kick/${conn.id}`, {
          method: 'POST',
          signal: AbortSignal.timeout(3000),
        });
      }
    } catch (err) {
      this.logger.warn(
        `MediaMTX kick failed for ${normalized}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private parseStreamKeyFromPath(path: string): string | null {
    const normalized = path.replace(/^\/+/, '').trim();
    const match = normalized.match(/^live\/([^/]+)/i);
    return match?.[1] ?? null;
  }

  private webrtcPlaybackUrl(
    status: StreamStatus,
    streamKey: string | null | undefined,
  ): string | null {
    if (status !== StreamStatus.live || !streamKey?.trim()) return null;
    const webrtcBase = (
      this.config.get<string>('MEDIAMTX_WEBRTC_PUBLIC_URL') ??
      'http://localhost:8889'
    ).replace(/\/$/, '');
    return `${webrtcBase}/live/${streamKey.trim()}/whep`;
  }

  private mapStream(
    s: {
      id: string;
      title: string;
      category: string | null;
      status: StreamStatus;
      thumbnailUrl: string | null;
      hlsPlaybackUrl: string | null;
      temporaryStreamToken: string | null;
      viewerCount: number;
      startedAt: Date | null;
      creator: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        bio?: string | null;
      };
    },
    viewerId?: string,
  ) {
    const startedAgo = s.startedAt
      ? `${Math.max(1, Math.floor((Date.now() - s.startedAt.getTime()) / 60000))}m ago`
      : 'just now';
    const rtmpBase = (
      this.config.get<string>('RTMP_INGEST_URL') ?? 'rtmp://localhost:1935/live'
    ).replace(/\/$/, '');

    const isOwner =
      viewerId != null &&
      viewerId === s.creator.id &&
      s.temporaryStreamToken &&
      (s.status === StreamStatus.live || s.status === StreamStatus.scheduled);

    const webrtcBase = (
      this.config.get<string>('MEDIAMTX_WEBRTC_PUBLIC_URL') ??
      'http://localhost:8889'
    ).replace(/\/$/, '');

    return {
      id: s.id,
      slug: s.creator.username,
      title: s.title,
      thumbnail: s.thumbnailUrl,
      streamer: s.creator.displayName ?? s.creator.username,
      streamerSlug: s.creator.username,
      streamerAvatar: s.creator.avatarUrl,
      viewers: this.formatCount(s.viewerCount),
      viewerCount: s.viewerCount,
      category: s.category ?? 'Live',
      status: s.status,
      startedAgo,
      description: s.creator.bio,
      hlsPlaybackUrl: s.hlsPlaybackUrl,
      webrtcPlaybackUrl: this.webrtcPlaybackUrl(
        s.status,
        s.temporaryStreamToken,
      ),
      creatorId: s.creator.id,
      studio: isOwner
        ? {
            streamKey: s.temporaryStreamToken!,
            rtmpUrl: rtmpBase,
            whipPublishUrl: `${webrtcBase}/live/${s.temporaryStreamToken}/whip`,
          }
        : undefined,
    };
  }

  private formatCount(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }
}
