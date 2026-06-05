import { randomUUID } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamStatus, StreamerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  ) {}

  async listLive() {
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

  async getOne(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const stream = await this.prisma.stream.findFirst({
      where: isUuid
        ? { id: idOrSlug }
        : {
            creator: { username: idOrSlug.toLowerCase() },
            status: { in: [StreamStatus.live, StreamStatus.ended] },
          },
      orderBy: { startedAt: 'desc' },
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
    if (!stream) throw new NotFoundException('Stream not found');
    return this.mapStream(stream);
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
        const alerts = await this.prisma.creatorLiveAlert.findMany({
          where: { creatorId: stream.creatorId },
        });
        if (alerts.length > 0) {
          const name =
            stream.creator.displayName ?? stream.creator.username;
          await this.prisma.notification.createMany({
            data: alerts.map((a) => ({
              userId: a.userId,
              type: 'live' as const,
              actorId: stream.creatorId,
              referenceId: stream.id,
              message: `${name} is live now`,
            })),
          });
        }
      }
    }
    return { ok: true, hlsPlaybackUrl };
  }

  /** MediaMTX runOnNotReady — publisher disconnected. */
  async mediamtxDone(path: string) {
    const streamKey = this.parseStreamKeyFromPath(path);
    if (!streamKey) return { ok: false };

    await this.prisma.stream.updateMany({
      where: {
        temporaryStreamToken: streamKey,
        status: { in: [StreamStatus.live, StreamStatus.scheduled] },
      },
      data: {
        status: StreamStatus.ended,
        endedAt: new Date(),
      },
    });

    this.logger.log(`Stream ended: ${streamKey}`);
    return { ok: true };
  }

  private parseStreamKeyFromPath(path: string): string | null {
    const normalized = path.replace(/^\/+/, '').trim();
    const match = normalized.match(/^live\/([^/]+)/i);
    return match?.[1] ?? null;
  }

  private mapStream(
    s: {
      id: string;
      title: string;
      category: string | null;
      status: StreamStatus;
      thumbnailUrl: string | null;
      hlsPlaybackUrl: string | null;
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
  ) {
    const startedAgo = s.startedAt
      ? `${Math.max(1, Math.floor((Date.now() - s.startedAt.getTime()) / 60000))}m ago`
      : 'just now';
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
      creatorId: s.creator.id,
    };
  }

  private formatCount(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }
}
