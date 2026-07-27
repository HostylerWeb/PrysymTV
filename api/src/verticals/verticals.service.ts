import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  DislikeTargetType,
  LikeTargetType,
  SavedItemType,
  VerticalCreatorStatus,
  VerticalSeriesStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PlaybackService } from '../playback/playback.service';
import { VideosService } from '../videos/videos.service';
import { AttachEpisodeVideoDto } from './dto/attach-episode-video.dto';
import { CreateVerticalEpisodeDto } from './dto/create-vertical-episode.dto';
import { CreateVerticalSeriesDto } from './dto/create-vertical-series.dto';

@Injectable()
export class VerticalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly playback: PlaybackService,
    private readonly videos: VideosService,
  ) {}

  private async assertVerticalCreatorApproved(creatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { verticalCreatorStatus: true },
    });
    if (!user || user.verticalCreatorStatus !== VerticalCreatorStatus.approved) {
      throw new ForbiddenException(
        'Vertical series upload requires an approved vertical creator application',
      );
    }
  }

  private pickEpisodeThumbnail(
    episodes: Array<{ thumbnailUrl: string | null }>,
  ): string | null {
    for (const episode of episodes) {
      if (episode.thumbnailUrl) return episode.thumbnailUrl;
    }
    return null;
  }

  /** Published (ready) episode count shown on cards and series detail. */
  private async syncSeriesPublishedEpisodeCount(seriesId: string) {
    const count = await this.prisma.verticalEpisode.count({
      where: { seriesId, status: ContentStatus.ready },
    });
    await this.prisma.verticalSeries.update({
      where: { id: seriesId },
      data: { totalEpisodes: count },
    });
    return count;
  }

  /** Promote episodes stuck in processing when their linked video finished transcoding. */
  private async reconcileStuckEpisodes(seriesId: string) {
    await this.videos.reconcileVerticalSeriesProcessing(seriesId);

    const processing = await this.prisma.verticalEpisode.findMany({
      where: { seriesId, status: ContentStatus.processing },
      select: { id: true },
    });
    if (!processing.length) return;

    const videos = await this.prisma.video.findMany({
      where: {
        verticalEpisodeId: { in: processing.map((e) => e.id) },
        status: ContentStatus.ready,
      },
    });

    for (const video of videos) {
      if (!video.verticalEpisodeId) continue;
      await this.prisma.verticalEpisode.update({
        where: { id: video.verticalEpisodeId },
        data: {
          status: ContentStatus.ready,
          videoUrl:
            this.storage.resolveVideoHlsMasterKey(video.hlsMasterUrl, video.id) ??
            video.hlsMasterUrl,
          thumbnailUrl: video.thumbnailUrl ?? undefined,
          durationSeconds: video.durationSeconds ?? undefined,
        },
      });
    }

    if (videos.length > 0) {
      await this.syncSeriesPublishedEpisodeCount(seriesId);
    }
  }

  private async resolvePosterFallbacks<
    T extends { id: string; posterUrl: string | null },
  >(items: T[]): Promise<T[]> {
    const missing = items.filter((item) => !item.posterUrl);
    if (!missing.length) return items;

    const episodes = await this.prisma.verticalEpisode.findMany({
      where: {
        seriesId: { in: missing.map((item) => item.id) },
        status: ContentStatus.ready,
        thumbnailUrl: { not: null },
      },
      orderBy: { episodeNumber: 'asc' },
      select: { seriesId: true, thumbnailUrl: true },
    });

    const posterBySeriesId = new Map<string, string>();
    for (const episode of episodes) {
      if (!posterBySeriesId.has(episode.seriesId) && episode.thumbnailUrl) {
        posterBySeriesId.set(episode.seriesId, episode.thumbnailUrl);
      }
    }

    return items.map((item) => ({
      ...item,
      posterUrl: item.posterUrl ?? posterBySeriesId.get(item.id) ?? null,
    }));
  }

  async listSeries() {
    const rows = await this.prisma.verticalSeries.findMany({
      where: { status: VerticalSeriesStatus.published, visibility: 'public' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        posterUrl: true,
        genre: true,
        _count: {
          select: {
            episodes: { where: { status: ContentStatus.ready } },
          },
        },
      },
    });
    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      tagline: row.tagline,
      posterUrl: row.posterUrl,
      genre: row.genre,
      totalEpisodes: row._count.episodes,
    }));
    return { items: await this.resolvePosterFallbacks(items) };
  }

  async getSeries(slug: string) {
    const seriesMeta = await this.prisma.verticalSeries.findFirst({
      where: { slug, status: VerticalSeriesStatus.published },
      select: { id: true },
    });
    if (!seriesMeta) throw new NotFoundException('Series not found');

    await this.reconcileStuckEpisodes(seriesMeta.id);

    const series = await this.prisma.verticalSeries.findFirst({
      where: { id: seriesMeta.id },
      include: {
        episodes: {
          where: { status: ContentStatus.ready },
          orderBy: { episodeNumber: 'asc' },
          select: {
            id: true,
            episodeNumber: true,
            title: true,
            thumbnailUrl: true,
            durationSeconds: true,
            cliffhanger: true,
          },
        },
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    if (!series) throw new NotFoundException('Series not found');
    return {
      ...series,
      totalEpisodes: series.episodes.length,
      posterUrl:
        series.posterUrl ?? this.pickEpisodeThumbnail(series.episodes) ?? null,
    };
  }

  async getEpisode(slug: string, episodeNumber: number, viewerId?: string) {
    const series = await this.prisma.verticalSeries.findFirst({
      where: { slug, status: VerticalSeriesStatus.published },
      select: { id: true, slug: true, title: true, creatorId: true, posterUrl: true },
    });
    if (!series) throw new NotFoundException('Series not found');

    await this.reconcileStuckEpisodes(series.id);

    const episode = await this.prisma.verticalEpisode.findFirst({
      where: {
        seriesId: series.id,
        episodeNumber,
        status: 'ready',
      },
    });
    if (!episode) throw new NotFoundException('Episode not found');

    const next = await this.prisma.verticalEpisode.findFirst({
      where: {
        seriesId: series.id,
        episodeNumber: episodeNumber + 1,
        status: 'ready',
      },
      select: { episodeNumber: true, title: true },
    });

    let liked = false;
    let saved = false;
    let seriesSaved = false;
    if (viewerId) {
      const [likeRow, episodeSave, seriesSave] = await Promise.all([
        this.prisma.like.findUnique({
          where: {
            userId_targetType_targetId: {
              userId: viewerId,
              targetType: LikeTargetType.vertical_episode,
              targetId: episode.id,
            },
          },
        }),
        this.prisma.savedItem.findUnique({
          where: {
            userId_itemType_itemId: {
              userId: viewerId,
              itemType: SavedItemType.vertical_episode,
              itemId: episode.id,
            },
          },
        }),
        this.prisma.savedItem.findUnique({
          where: {
            userId_itemType_itemId: {
              userId: viewerId,
              itemType: SavedItemType.vertical_series,
              itemId: series.id,
            },
          },
        }),
      ]);
      liked = !!likeRow;
      saved = !!episodeSave;
      seriesSaved = !!seriesSave;
    }

    const playback = await this.playback.buildStoredMediaPlaybackUrls(
      episode.videoUrl,
    );

    return {
      series: {
        id: series.id,
        slug: series.slug,
        title: series.title,
        creatorId: series.creatorId,
        posterUrl: series.posterUrl ?? episode.thumbnailUrl ?? null,
        saved: seriesSaved,
      },
      episode: {
        id: episode.id,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        videoUrl: playback.videoUrl,
        durationSeconds: episode.durationSeconds,
        cliffhanger: episode.cliffhanger,
        viewsCount: episode.viewsCount,
        likesCount: episode.likesCount,
        liked,
        saved,
      },
      nextEpisode: next,
    };
  }

  async recordEpisodeView(episodeId: string) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id: episodeId },
    });
    if (!episode || episode.status !== ContentStatus.ready) {
      throw new NotFoundException('Episode not found');
    }
    await this.prisma.verticalEpisode.update({
      where: { id: episodeId },
      data: { viewsCount: { increment: 1 } },
    });
    return { success: true, viewsCount: episode.viewsCount + 1 };
  }

  async toggleEpisodeLike(userId: string, episodeId: string) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id: episodeId },
    });
    if (!episode || episode.status !== ContentStatus.ready) {
      throw new NotFoundException('Episode not found');
    }

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: LikeTargetType.vertical_episode,
          targetId: episodeId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: LikeTargetType.vertical_episode,
              targetId: episodeId,
            },
          },
        });
        await tx.verticalEpisode.update({
          where: { id: episodeId },
          data: { likesCount: { decrement: 1 } },
        });
      });
      return { liked: false };
    }

    await this.prisma.$transaction(async (tx) => {
      const dislike = await tx.dislike.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: DislikeTargetType.vertical_episode,
            targetId: episodeId,
          },
        },
      });
      if (dislike) {
        await tx.dislike.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: DislikeTargetType.vertical_episode,
              targetId: episodeId,
            },
          },
        });
        await tx.verticalEpisode.update({
          where: { id: episodeId },
          data: { dislikesCount: { decrement: 1 } },
        });
      }
      await tx.like.create({
        data: {
          userId,
          targetType: LikeTargetType.vertical_episode,
          targetId: episodeId,
        },
      });
      await tx.verticalEpisode.update({
        where: { id: episodeId },
        data: { likesCount: { increment: 1 } },
      });
    });
    return { liked: true, disliked: false };
  }

  async toggleEpisodeDislike(userId: string, episodeId: string) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id: episodeId },
    });
    if (!episode || episode.status !== ContentStatus.ready) {
      throw new NotFoundException('Episode not found');
    }

    const existing = await this.prisma.dislike.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: DislikeTargetType.vertical_episode,
          targetId: episodeId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.dislike.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: DislikeTargetType.vertical_episode,
              targetId: episodeId,
            },
          },
        });
        await tx.verticalEpisode.update({
          where: { id: episodeId },
          data: { dislikesCount: { decrement: 1 } },
        });
      });
      return { disliked: false };
    }

    await this.prisma.$transaction(async (tx) => {
      const like = await tx.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: LikeTargetType.vertical_episode,
            targetId: episodeId,
          },
        },
      });
      if (like) {
        await tx.like.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: LikeTargetType.vertical_episode,
              targetId: episodeId,
            },
          },
        });
        await tx.verticalEpisode.update({
          where: { id: episodeId },
          data: { likesCount: { decrement: 1 } },
        });
      }
      await tx.dislike.create({
        data: {
          userId,
          targetType: DislikeTargetType.vertical_episode,
          targetId: episodeId,
        },
      });
      await tx.verticalEpisode.update({
        where: { id: episodeId },
        data: { dislikesCount: { increment: 1 } },
      });
    });
    return { disliked: true, liked: false };
  }

  async toggleEpisodeSave(userId: string, episodeId: string) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id: episodeId },
    });
    if (!episode || episode.status !== ContentStatus.ready) {
      throw new NotFoundException('Episode not found');
    }

    const existing = await this.prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId,
          itemType: SavedItemType.vertical_episode,
          itemId: episodeId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedItem.delete({
        where: {
          userId_itemType_itemId: {
            userId,
            itemType: SavedItemType.vertical_episode,
            itemId: episodeId,
          },
        },
      });
      return { saved: false };
    }

    await this.prisma.savedItem.create({
      data: {
        userId,
        itemType: SavedItemType.vertical_episode,
        itemId: episodeId,
      },
    });
    return { saved: true };
  }

  async toggleSeriesSave(userId: string, seriesId: string) {
    const series = await this.prisma.verticalSeries.findUnique({
      where: { id: seriesId },
    });
    if (!series || series.status !== VerticalSeriesStatus.published) {
      throw new NotFoundException('Series not found');
    }

    const existing = await this.prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId,
          itemType: SavedItemType.vertical_series,
          itemId: seriesId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedItem.delete({
        where: {
          userId_itemType_itemId: {
            userId,
            itemType: SavedItemType.vertical_series,
            itemId: seriesId,
          },
        },
      });
      return { saved: false };
    }

    await this.prisma.savedItem.create({
      data: {
        userId,
        itemType: SavedItemType.vertical_series,
        itemId: seriesId,
      },
    });
    return { saved: true };
  }

  async createSeries(creatorId: string, dto: CreateVerticalSeriesDto) {
    await this.assertVerticalCreatorApproved(creatorId);
    const exists = await this.prisma.verticalSeries.findUnique({
      where: { slug: dto.slug },
    });
    if (exists) throw new ConflictException('Slug already in use');

    return this.prisma.verticalSeries.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        tagline: dto.tagline,
        description: dto.description,
        genre: dto.genre,
        posterUrl: dto.posterUrl,
        bannerUrl: dto.bannerUrl,
        creatorId,
        status: VerticalSeriesStatus.published,
        totalEpisodes: 0,
      },
    });
  }

  async createEpisode(creatorId: string, slug: string, dto: CreateVerticalEpisodeDto) {
    await this.assertVerticalCreatorApproved(creatorId);
    const series = await this.prisma.verticalSeries.findFirst({ where: { slug } });
    if (!series) throw new NotFoundException('Series not found');
    if (series.creatorId && series.creatorId !== creatorId) {
      throw new ForbiddenException('Not your series');
    }

    const existing = await this.prisma.verticalEpisode.findUnique({
      where: {
        seriesId_episodeNumber: {
          seriesId: series.id,
          episodeNumber: dto.episodeNumber,
        },
      },
    });

    if (existing) {
      if (existing.status === ContentStatus.ready) {
        throw new ConflictException(
          `Episode ${dto.episodeNumber} is already published. Delete it first to replace.`,
        );
      }

      await this.prisma.video.updateMany({
        where: { verticalEpisodeId: existing.id },
        data: { verticalEpisodeId: null },
      });

      const episode = await this.prisma.verticalEpisode.update({
        where: { id: existing.id },
        data: {
          title: dto.title,
          description: dto.description,
          cliffhanger: dto.cliffhanger,
          durationSeconds: dto.durationSeconds ?? 120,
          status: ContentStatus.processing,
          videoUrl: null,
          thumbnailUrl: null,
        },
      });

      await this.prisma.verticalSeries.update({
        where: { id: series.id },
        data: { creatorId: series.creatorId ?? creatorId },
      });

      return episode;
    }

    const episode = await this.prisma.verticalEpisode.create({
      data: {
        seriesId: series.id,
        episodeNumber: dto.episodeNumber,
        title: dto.title,
        description: dto.description,
        cliffhanger: dto.cliffhanger,
        durationSeconds: dto.durationSeconds ?? 120,
        status: ContentStatus.processing,
      },
    });

    await this.prisma.verticalSeries.update({
      where: { id: series.id },
      data: { creatorId: series.creatorId ?? creatorId },
    });

    return episode;
  }

  async attachEpisodeVideo(
    creatorId: string,
    episodeId: string,
    dto: AttachEpisodeVideoDto,
  ) {
    await this.assertVerticalCreatorApproved(creatorId);
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id: episodeId },
      include: { series: true },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    if (episode.series.creatorId && episode.series.creatorId !== creatorId) {
      throw new ForbiddenException('Not your episode');
    }

    const video = await this.prisma.video.findUnique({ where: { id: dto.videoId } });
    if (!video || video.creatorId !== creatorId) {
      throw new ForbiddenException('Invalid video');
    }

    const thumbnailUrl = video.thumbnailUrl ?? episode.thumbnailUrl;
    const resolvedVideoUrl =
      this.storage.resolveVideoHlsMasterKey(video.hlsMasterUrl, video.id) ??
      video.hlsMasterUrl;
    const episodeStatus =
      video.status === ContentStatus.ready
        ? ContentStatus.ready
        : ContentStatus.processing;

    if (video.verticalEpisodeId !== episodeId) {
      await this.prisma.video.update({
        where: { id: dto.videoId },
        data: { verticalEpisodeId: episodeId },
      });
    }

    const updatedEpisode = await this.prisma.verticalEpisode.update({
      where: { id: episodeId },
      data: {
        videoUrl: resolvedVideoUrl,
        thumbnailUrl,
        status: episodeStatus,
        durationSeconds: video.durationSeconds ?? episode.durationSeconds,
      },
    });

    if (episodeStatus === ContentStatus.ready) {
      await this.syncSeriesPublishedEpisodeCount(episode.series.id);
    }

    if (!episode.series.posterUrl && thumbnailUrl) {
      await this.prisma.verticalSeries.update({
        where: { id: episode.series.id },
        data: { posterUrl: thumbnailUrl },
      });
    }

    return updatedEpisode;
  }

  async listMySeries(creatorId: string) {
    await this.assertVerticalCreatorApproved(creatorId);
    const items = await this.prisma.verticalSeries.findMany({
      where: { creatorId },
      orderBy: { updatedAt: 'desc' },
      include: {
        episodes: { orderBy: { episodeNumber: 'asc' } },
      },
    });
    return { items };
  }

  private async assertEpisodeOwner(creatorId: string, episodeId: string) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id: episodeId },
      include: { series: true },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    if (episode.series.creatorId && episode.series.creatorId !== creatorId) {
      throw new ForbiddenException('Not your episode');
    }
    return episode;
  }

  private async syncSeriesEpisodeCount(seriesId: string) {
    await this.syncSeriesPublishedEpisodeCount(seriesId);
  }

  async updateEpisode(
    creatorId: string,
    episodeId: string,
    dto: {
      episodeNumber?: number;
      title?: string;
      description?: string;
      cliffhanger?: string;
    },
  ) {
    await this.assertVerticalCreatorApproved(creatorId);
    const episode = await this.assertEpisodeOwner(creatorId, episodeId);

    if (
      dto.episodeNumber != null &&
      dto.episodeNumber !== episode.episodeNumber
    ) {
      const conflict = await this.prisma.verticalEpisode.findFirst({
        where: {
          seriesId: episode.seriesId,
          episodeNumber: dto.episodeNumber,
          NOT: { id: episodeId },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Episode ${dto.episodeNumber} already exists in this series`,
        );
      }
    }

    return this.prisma.verticalEpisode.update({
      where: { id: episodeId },
      data: {
        episodeNumber: dto.episodeNumber,
        title: dto.title,
        description: dto.description,
        cliffhanger: dto.cliffhanger,
      },
    });
  }

  async deleteEpisode(creatorId: string, episodeId: string) {
    await this.assertVerticalCreatorApproved(creatorId);
    const episode = await this.assertEpisodeOwner(creatorId, episodeId);
    await this.prisma.verticalEpisode.delete({ where: { id: episodeId } });
    await this.syncSeriesEpisodeCount(episode.seriesId);
    return { success: true };
  }

  async deleteSeries(creatorId: string, slug: string) {
    await this.assertVerticalCreatorApproved(creatorId);
    const series = await this.assertSeriesOwner(creatorId, slug);
    const episodes = await this.prisma.verticalEpisode.findMany({
      where: { seriesId: series.id },
    });
    for (const episode of episodes) {
      await this.storage.purgePublicMediaUrl(episode.videoUrl);
      await this.storage.purgePublicMediaUrl(episode.thumbnailUrl);
    }
    await this.storage.purgePublicMediaUrl(series.posterUrl);
    await this.prisma.verticalSeries.delete({ where: { id: series.id } });
    return { success: true };
  }

  private async assertSeriesOwner(creatorId: string, slug: string) {
    const series = await this.prisma.verticalSeries.findUnique({
      where: { slug },
    });
    if (!series) throw new NotFoundException('Series not found');
    if (series.creatorId !== creatorId) {
      throw new ForbiddenException('Not your series');
    }
    return series;
  }
}
