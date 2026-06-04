import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ContentStatus,
  LikeTargetType,
  Visibility,
} from '@prisma/client';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { probeMedia } from '../queue/ffmpeg.util';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePodcastEpisodeDto } from './dto/create-episode.dto';
import { CreatePodcastShowDto } from './dto/create-show.dto';
import { PodcastUploadCompleteDto } from './dto/podcast-upload-complete.dto';
import { PodcastUploadInitDto } from './dto/podcast-upload-init.dto';

@Injectable()
export class PodcastsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  async listShows(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.podcastShow.findMany({
        where: { visibility: Visibility.public },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          creator: { select: { username: true, displayName: true } },
          _count: { select: { episodes: true } },
        },
      }),
      this.prisma.podcastShow.count({ where: { visibility: Visibility.public } }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async featuredShow() {
    const show = await this.prisma.podcastShow.findFirst({
      where: {
        visibility: Visibility.public,
        episodes: { some: { status: ContentStatus.ready } },
      },
      orderBy: { followersCount: 'desc' },
      include: {
        creator: { select: { username: true, displayName: true } },
        episodes: {
          where: { status: ContentStatus.ready },
          orderBy: { publishedAt: 'desc' },
          take: 1,
        },
        _count: { select: { episodes: true } },
      },
    });
    if (!show) return { show: null };
    return { show };
  }

  async getShow(id: string) {
    const show = await this.prisma.podcastShow.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        episodes: {
          where: { status: ContentStatus.ready, visibility: Visibility.public },
          orderBy: { publishedAt: 'desc' },
        },
        _count: { select: { episodes: true } },
      },
    });
    if (!show) throw new NotFoundException('Podcast show not found');
    return show;
  }

  async listMyShows(userId: string) {
    const items = await this.prisma.podcastShow.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        episodes: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            durationSeconds: true,
            publishedAt: true,
          },
        },
        _count: { select: { episodes: true } },
      },
    });
    return { items };
  }

  async createShow(userId: string, dto: CreatePodcastShowDto) {
    const show = await this.prisma.podcastShow.create({
      data: {
        creatorId: userId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        coverUrl: dto.coverUrl,
        category: dto.category?.trim() || 'General',
        visibility: Visibility.public,
      },
    });
    return show;
  }

  async createEpisode(
    userId: string,
    showId: string,
    dto: CreatePodcastEpisodeDto,
  ) {
    const show = await this.prisma.podcastShow.findUnique({
      where: { id: showId },
    });
    if (!show) throw new NotFoundException('Podcast show not found');
    if (show.creatorId !== userId) {
      throw new ForbiddenException('Not your podcast show');
    }

    const episode = await this.prisma.podcastEpisode.create({
      data: {
        showId,
        creatorId: userId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        coverUrl: dto.coverUrl ?? show.coverUrl,
        status: ContentStatus.processing,
        visibility: Visibility.public,
      },
    });
    return episode;
  }

  async uploadInit(
    userId: string,
    episodeId: string,
    dto: PodcastUploadInitDto,
  ) {
    const episode = await this.assertEpisodeOwner(userId, episodeId);
    this.storage.assertAudioMime(dto.mimeType);
    const objectKey = this.storage.buildPodcastAudioKey(
      episode.id,
      dto.fileName,
    );
    const target = await this.storage.createUploadTargetForKey(
      objectKey,
      dto.mimeType,
    );
    if (target.uploadMethod === 'POST') {
      const base = this.storage.getSettings().apiPublicUrl.replace(/\/$/, '');
      target.uploadUrl = `${base}/media/podcast-upload`;
    }
    return {
      episodeId: episode.id,
      objectKey: target.objectKey,
      uploadUrl: target.uploadUrl,
      uploadMethod: target.uploadMethod,
      uploadHeaders: target.uploadHeaders,
      expiresIn: target.expiresIn,
      publicUrl: this.storage.getPublicUrl(objectKey),
    };
  }

  async uploadComplete(
    userId: string,
    episodeId: string,
    dto: PodcastUploadCompleteDto,
  ) {
    const episode = await this.assertEpisodeOwner(userId, episodeId);
    const objectKey =
      dto.objectKey?.replace(/^\/+/, '') ??
      this.storage.buildPodcastAudioKey(episode.id);

    const exists = await this.storage.objectExists(objectKey);
    if (!exists) {
      throw new BadRequestException(
        'Upload not found. Finish uploading the audio file first.',
      );
    }

    const size = await this.storage.getObjectSize(objectKey);
    if (size <= 0) throw new BadRequestException('Uploaded file is empty');

    const ffprobePath =
      this.config.get<string>('FFPROBE_PATH')?.trim() ?? 'ffprobe';
    const workRoot = await mkdtemp(join(tmpdir(), `prysym-podcast-${episodeId}-`));
    const inputPath = join(workRoot, 'audio');
    let durationSeconds = 0;

    try {
      await this.storage.downloadToFile(objectKey, inputPath);
      const probe = await probeMedia(inputPath, ffprobePath);
      if (!probe.hasAudio) {
        throw new BadRequestException('File does not contain audio');
      }
      durationSeconds = Math.max(1, Math.round(probe.durationSeconds));
    } finally {
      await rm(workRoot, { recursive: true, force: true });
    }

    const audioUrl = this.storage.getPublicUrl(objectKey);
    const updated = await this.prisma.podcastEpisode.update({
      where: { id: episodeId },
      data: {
        status: ContentStatus.ready,
        audioUrl,
        durationSeconds,
        publishedAt: new Date(),
      },
    });

    return {
      episodeId: updated.id,
      status: updated.status,
      audioUrl: updated.audioUrl,
      durationSeconds: updated.durationSeconds,
    };
  }

  async episodesFeed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.podcastEpisode.findMany({
        where: { status: ContentStatus.ready, visibility: Visibility.public },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          show: { select: { id: true, title: true, coverUrl: true } },
          creator: { select: { username: true, displayName: true } },
        },
      }),
      this.prisma.podcastEpisode.count({
        where: { status: ContentStatus.ready, visibility: Visibility.public },
      }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async getEpisode(id: string, viewerId?: string) {
    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id },
      include: {
        show: true,
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    if (
      episode.status !== ContentStatus.ready &&
      episode.creatorId !== viewerId
    ) {
      throw new NotFoundException('Episode not found');
    }

    let liked = false;
    if (viewerId) {
      const like = await this.prisma.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId: viewerId,
            targetType: LikeTargetType.podcast_episode,
            targetId: id,
          },
        },
      });
      liked = !!like;
    }

    return { ...episode, liked };
  }

  async recordPlay(id: string) {
    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id },
    });
    if (!episode || episode.status !== ContentStatus.ready) {
      throw new NotFoundException('Episode not found');
    }
    await this.prisma.podcastEpisode.update({
      where: { id },
      data: { playsCount: { increment: 1 } },
    });
    return { success: true };
  }

  async toggleLike(userId: string, episodeId: string) {
    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id: episodeId },
    });
    if (!episode || episode.status !== ContentStatus.ready) {
      throw new NotFoundException('Episode not found');
    }

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: LikeTargetType.podcast_episode,
          targetId: episodeId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: LikeTargetType.podcast_episode,
              targetId: episodeId,
            },
          },
        }),
        this.prisma.podcastEpisode.update({
          where: { id: episodeId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false };
    }

    await this.prisma.$transaction([
      this.prisma.like.create({
        data: {
          userId,
          targetType: LikeTargetType.podcast_episode,
          targetId: episodeId,
        },
      }),
      this.prisma.podcastEpisode.update({
        where: { id: episodeId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);
    return { liked: true };
  }

  private async assertEpisodeOwner(userId: string, episodeId: string) {
    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id: episodeId },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    if (episode.creatorId !== userId) {
      throw new ForbiddenException('Not your episode');
    }
    return episode;
  }
}
