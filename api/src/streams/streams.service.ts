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
import {
  Prisma,
  RevenueSourceType,
  StreamAccessType,
  StreamStatus,
  StreamerStatus,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PlaybackService } from '../playback/playback.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { StorageService } from '../storage/storage.service';
import { verticalFromCategorySlug } from '../common/utils/category-vertical.util';
import { coinsToGrossUsd, usdToCoinCost } from '../common/utils/coin-usd.util';
import { RedisCacheService } from '../common/cache/redis-cache.service';
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

type StreamRow = {
  id: string;
  title: string;
  category: string | null;
  status: StreamStatus;
  accessType: StreamAccessType;
  entryPriceUsd: Prisma.Decimal | null;
  entryCoinCost: number | null;
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
};

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly streamsGateway: StreamsGateway,
    private readonly storage: StorageService,
    private readonly playback: PlaybackService,
    private readonly platformSettings: PlatformSettingsService,
    private readonly revenueSplit: RevenueSplitService,
    private readonly cache: RedisCacheService,
  ) {}

  async listLive(viewerId?: string) {
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
    const mapped = await this.mapStreams(items, viewerId);
    return { items: mapped };
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

  async unlockStream(streamId: string, userId: string) {
    const stream = await this.prisma.stream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        creatorId: true,
        accessType: true,
        entryCoinCost: true,
        status: true,
      },
    });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.accessType !== StreamAccessType.paid) {
      throw new BadRequestException('This stream is free to watch');
    }
    if (stream.creatorId === userId) {
      throw new BadRequestException('You already have access as the stream owner');
    }
    if (
      stream.status !== StreamStatus.live &&
      stream.status !== StreamStatus.scheduled
    ) {
      throw new BadRequestException('This stream is no longer available');
    }

    const coinCost = stream.entryCoinCost;
    if (coinCost == null || coinCost <= 0) {
      throw new BadRequestException('Stream entry price is not configured');
    }

    const existing = await this.prisma.streamAccess.findUnique({
      where: { userId_streamId: { userId, streamId } },
    });
    if (existing) {
      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { coinsBalance: true },
      });
      return {
        success: true,
        alreadyOwned: true,
        coinsSpent: 0,
        coinsRemaining: sender?.coinsBalance ?? 0,
        hasAccess: true,
      };
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true },
    });
    if (!sender) throw new NotFoundException('User not found');
    if (sender.coinsBalance < coinCost) {
      throw new BadRequestException('Insufficient coins');
    }

    const grossUsd = coinsToGrossUsd(
      coinCost,
      await this.platformSettings.getCoinUsd(),
    );

    const access = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { coinsBalance: { decrement: coinCost } },
      });
      return tx.streamAccess.create({
        data: { userId, streamId, coinCost },
      });
    });

    const { batch } = await this.revenueSplit.distributeAndPersist({
      ruleKey: 'paid_live_stream',
      sourceType: RevenueSourceType.ticket,
      sourceId: access.id,
      grossAmountUsd: grossUsd,
      creatorId: stream.creatorId,
      metadata: { streamId, coins: coinCost },
    });

    await this.prisma.streamAccess.update({
      where: { id: access.id },
      data: { revenueBatchId: batch.id },
    });

    const updatedSender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true },
    });

    return {
      success: true,
      alreadyOwned: false,
      coinsSpent: coinCost,
      coinsRemaining: updatedSender?.coinsBalance ?? 0,
      hasAccess: true,
    };
  }

  /** When webhooks fail, promote scheduled streams that already have an HLS manifest. */
  /** Promote scheduled streams on air; end stale rows with no HLS manifest. */
  async syncStreamsFromIngest() {
    await this.syncScheduledStreamsFromIngest();

    const staleLive = await this.prisma.stream.findMany({
      where: {
        status: StreamStatus.live,
        temporaryStreamToken: { not: null },
        startedAt: { lt: new Date(Date.now() - 90_000) },
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

  async initStream(
    creatorId: string,
    title: string,
    category?: string,
    accessType: 'free' | 'paid' = 'free',
    entryPriceUsd?: number,
  ) {
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

    const resolvedAccess =
      accessType === 'paid' ? StreamAccessType.paid : StreamAccessType.free;

    let entryCoinCost: number | null = null;
    let priceUsd: Prisma.Decimal | null = null;

    if (resolvedAccess === StreamAccessType.paid) {
      if (entryPriceUsd == null || !Number.isFinite(entryPriceUsd)) {
        throw new BadRequestException('Paid streams require an entry price in USD');
      }
      const economy = await this.platformSettings.getEconomy();
      const minUsd = economy.minPaidStreamUsd;
      if (entryPriceUsd < minUsd) {
        throw new BadRequestException(
          `Minimum paid stream price is $${minUsd.toFixed(2)}`,
        );
      }
      entryCoinCost = usdToCoinCost(entryPriceUsd, economy.coinUsd);
      priceUsd = new Prisma.Decimal(entryPriceUsd.toFixed(2));
    }

    const stream = await this.prisma.stream.create({
      data: {
        creatorId,
        title,
        category: category?.trim() || 'Live',
        vertical: verticalFromCategorySlug(category?.trim()) ?? undefined,
        status: StreamStatus.scheduled,
        accessType: resolvedAccess,
        entryPriceUsd: priceUsd,
        entryCoinCost,
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
      accessType: stream.accessType,
      entryPriceUsd: priceUsd != null ? Number(priceUsd) : null,
      entryCoinCost,
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
      // Home feed is cached per-user for 45s — bust it now so the new live
      // stream shows up on the next poll instead of after the TTL expires.
      void this.cache.delPattern('feed:home:*');
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
        viewerCount: 0,
      },
    });

    if (updated.count > 0 && stream) {
      this.streamsGateway.emitStreamEnded(stream.id);
      void this.cache.delPattern('feed:home:*');
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
        viewerCount: 0,
      },
    });

    this.streamsGateway.emitStreamEnded(streamId);
    void this.cache.delPattern('feed:home:*');
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

  async mapStreams(streams: StreamRow[], viewerId?: string) {
    const paidIds = streams
      .filter((s) => s.accessType === StreamAccessType.paid)
      .map((s) => s.id);
    const entitled = await this.getEntitledStreamIds(viewerId, paidIds);
    return streams.map((s) => this.mapStreamSync(s, viewerId, entitled));
  }

  async mapStream(stream: StreamRow, viewerId?: string) {
    const entitled =
      stream.accessType === StreamAccessType.paid && viewerId
        ? await this.getEntitledStreamIds(viewerId, [stream.id])
        : new Set<string>();
    return this.mapStreamSync(stream, viewerId, entitled);
  }

  private async getEntitledStreamIds(
    viewerId: string | undefined,
    streamIds: string[],
  ): Promise<Set<string>> {
    if (!viewerId || !streamIds.length) return new Set();
    const rows = await this.prisma.streamAccess.findMany({
      where: { userId: viewerId, streamId: { in: streamIds } },
      select: { streamId: true },
    });
    return new Set(rows.map((r) => r.streamId));
  }

  private mapStreamSync(
    s: StreamRow,
    viewerId?: string,
    entitledStreamIds: Set<string> = new Set(),
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

    const isPaid = s.accessType === StreamAccessType.paid;
    const hasAccess =
      !isPaid ||
      isOwner ||
      (viewerId != null && entitledStreamIds.has(s.id));

    const webrtcBase = (
      this.config.get<string>('MEDIAMTX_WEBRTC_PUBLIC_URL') ??
      'http://localhost:8889'
    ).replace(/\/$/, '');

    const hlsPlaybackUrl = hasAccess ? s.hlsPlaybackUrl : null;
    const webrtcUrl = hasAccess
      ? this.webrtcPlaybackUrl(s.status, s.temporaryStreamToken)
      : null;

    return {
      id: s.id,
      slug: s.creator.username,
      title: s.title,
      thumbnail: this.playback.resolvePublicAssetUrl(s.thumbnailUrl),
      streamer: s.creator.displayName ?? s.creator.username,
      streamerSlug: s.creator.username,
      streamerAvatar: this.playback.resolvePublicAssetUrl(s.creator.avatarUrl),
      viewers: this.formatCount(
        s.status === StreamStatus.live ? s.viewerCount : 0,
      ),
      viewerCount: s.status === StreamStatus.live ? s.viewerCount : 0,
      category: s.category ?? 'Live',
      status: s.status,
      startedAgo,
      description: s.creator.bio,
      accessType: s.accessType,
      entryPriceUsd:
        s.entryPriceUsd != null ? Number(s.entryPriceUsd) : null,
      entryCoinCost: s.entryCoinCost,
      isPaid,
      hasAccess,
      hlsPlaybackUrl,
      webrtcPlaybackUrl: webrtcUrl,
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

  async initThumbnailUpload(streamId: string, creatorId: string) {
    const stream = await this.prisma.stream.findFirst({
      where: { id: streamId, creatorId },
    });
    if (!stream) throw new NotFoundException('Stream not found');

    const objectKey = this.storage.buildStreamThumbnailKey(streamId);
    const target = await this.storage.createUploadTargetForKey(objectKey, 'image/jpeg');
    return {
      ...target,
      publicUrl: this.storage.getPublicUrl(objectKey),
    };
  }

  async confirmThumbnail(streamId: string, creatorId: string) {
    const stream = await this.prisma.stream.findFirst({
      where: { id: streamId, creatorId },
    });
    if (!stream) throw new NotFoundException('Stream not found');

    const objectKey = this.storage.buildStreamThumbnailKey(streamId);
    const thumbnailUrl = this.storage.getPublicUrl(objectKey);
    await this.prisma.stream.update({
      where: { id: streamId },
      data: { thumbnailUrl },
    });
    return {
      thumbnailUrl: this.playback.resolvePublicAssetUrl(thumbnailUrl),
    };
  }

  private formatCount(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }
}
