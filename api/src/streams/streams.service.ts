import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { StreamStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StreamsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const stream = await this.prisma.stream.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { creator: { username: idOrSlug } }],
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

  async initStream(creatorId: string, title: string) {
    const stream = await this.prisma.stream.create({
      data: {
        creatorId,
        title,
        status: StreamStatus.scheduled,
        temporaryStreamToken: `sk_${randomUUID().replace(/-/g, '')}`,
      },
    });
    return {
      streamId: stream.id,
      streamKey: stream.temporaryStreamToken,
      rtmpUrl: process.env.RTMP_INGEST_URL ?? 'rtmp://live.prysym.tv/app',
      status: stream.status,
    };
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
