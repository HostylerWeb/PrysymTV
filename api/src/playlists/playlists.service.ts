import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  PlaylistItemType,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddPlaylistItemDto } from './dto/add-playlist-item.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { ReorderPlaylistDto } from './dto/reorder-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadValidContentIds(items: Array<{
    itemType: PlaylistItemType;
    itemId: string;
  }>) {
    const videoIds = [
      ...new Set(
        items
          .filter((i) => i.itemType === PlaylistItemType.video)
          .map((i) => i.itemId),
      ),
    ];
    const episodeIds = [
      ...new Set(
        items
          .filter((i) => i.itemType === PlaylistItemType.podcast_episode)
          .map((i) => i.itemId),
      ),
    ];

    const [videos, episodes] = await Promise.all([
      videoIds.length
        ? this.prisma.video.findMany({
            where: { id: { in: videoIds } },
            select: { id: true },
          })
        : [],
      episodeIds.length
        ? this.prisma.podcastEpisode.findMany({
            where: { id: { in: episodeIds } },
            select: { id: true },
          })
        : [],
    ]);

    return {
      validVideoIds: new Set(videos.map((v) => v.id)),
      validEpisodeIds: new Set(episodes.map((e) => e.id)),
    };
  }

  private isResolvableItem(
    item: { itemType: PlaylistItemType; itemId: string },
    validVideoIds: Set<string>,
    validEpisodeIds: Set<string>,
  ) {
    return item.itemType === PlaylistItemType.video
      ? validVideoIds.has(item.itemId)
      : validEpisodeIds.has(item.itemId);
  }

  async countResolvableItems(playlistIds: string[]) {
    const counts = new Map<string, number>();
    for (const id of playlistIds) counts.set(id, 0);
    if (playlistIds.length === 0) return counts;

    const items = await this.prisma.playlistItem.findMany({
      where: { playlistId: { in: playlistIds } },
      select: { playlistId: true, itemType: true, itemId: true },
    });
    const { validVideoIds, validEpisodeIds } =
      await this.loadValidContentIds(items);

    for (const item of items) {
      if (
        this.isResolvableItem(item, validVideoIds, validEpisodeIds)
      ) {
        counts.set(
          item.playlistId,
          (counts.get(item.playlistId) ?? 0) + 1,
        );
      }
    }
    return counts;
  }

  async pruneOrphanedItems(playlistId: string) {
    const items = await this.prisma.playlistItem.findMany({
      where: { playlistId },
      select: { id: true, itemType: true, itemId: true },
    });
    if (items.length === 0) return 0;

    const { validVideoIds, validEpisodeIds } =
      await this.loadValidContentIds(items);
    const orphanIds = items
      .filter(
        (item) =>
          !this.isResolvableItem(item, validVideoIds, validEpisodeIds),
      )
      .map((item) => item.id);

    if (orphanIds.length === 0) return 0;

    await this.prisma.playlistItem.deleteMany({
      where: { id: { in: orphanIds } },
    });
    return orphanIds.length;
  }

  async removeContentReferences(
    itemType: PlaylistItemType,
    itemId: string,
  ) {
    await this.prisma.playlistItem.deleteMany({
      where: { itemType, itemId },
    });
  }

  async discoverPublic(limit = 12) {
    const playlists = await this.prisma.playlist.findMany({
      where: { visibility: Visibility.public },
      orderBy: [{ updatedAt: 'desc' }],
      take: Math.min(Math.max(limit, 1), 48),
      include: {
        creator: { select: { username: true, displayName: true } },
        _count: { select: { items: true } },
        items: {
          take: 1,
          orderBy: { sortOrder: 'asc' },
          select: { itemType: true, itemId: true },
        },
      },
    });

    const resolvableCounts = await this.countResolvableItems(
      playlists.map((p) => p.id),
    );
    const withItems = playlists.filter(
      (p) => (resolvableCounts.get(p.id) ?? 0) > 0,
    );
    withItems.sort(
      (a, b) =>
        (resolvableCounts.get(b.id) ?? 0) - (resolvableCounts.get(a.id) ?? 0),
    );

    const coverUrls = await Promise.all(
      withItems.map(async (p) => {
        if (p.coverUrl) return p.coverUrl;
        const first = p.items[0];
        if (!first) return null;
        if (first.itemType === PlaylistItemType.video) {
          const v = await this.prisma.video.findUnique({
            where: { id: first.itemId },
            select: { thumbnailUrl: true },
          });
          return v?.thumbnailUrl ?? null;
        }
        const ep = await this.prisma.podcastEpisode.findUnique({
          where: { id: first.itemId },
          select: { coverUrl: true, show: { select: { coverUrl: true } } },
        });
        return ep?.coverUrl ?? ep?.show.coverUrl ?? null;
      }),
    );

    return {
      items: withItems.slice(0, limit).map((p, i) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        coverUrl: coverUrls[i],
        type: p.type,
        itemCount: resolvableCounts.get(p.id) ?? 0,
        creatorSlug: p.creator.username,
        creatorName: p.creator.displayName ?? p.creator.username,
      })),
    };
  }

  async listMine(userId: string) {
    const playlists = await this.prisma.playlist.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: 'desc' },
    });
    const resolvableCounts = await this.countResolvableItems(
      playlists.map((p) => p.id),
    );
    return {
      items: playlists.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        coverUrl: p.coverUrl,
        type: p.type,
        visibility: p.visibility,
        itemCount: resolvableCounts.get(p.id) ?? 0,
        updatedAt: p.updatedAt,
      })),
    };
  }

  async listPublicByCreatorId(creatorId: string) {
    const playlists = await this.prisma.playlist.findMany({
      where: { creatorId, visibility: 'public' },
      orderBy: { updatedAt: 'desc' },
    });
    const resolvableCounts = await this.countResolvableItems(
      playlists.map((p) => p.id),
    );
    return {
      items: playlists.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        coverUrl: p.coverUrl,
        type: p.type,
        itemCount: resolvableCounts.get(p.id) ?? 0,
      })),
    };
  }

  async create(userId: string, dto: CreatePlaylistDto) {
    const title = dto.title.trim();
    const duplicate = await this.prisma.playlist.findFirst({
      where: {
        creatorId: userId,
        title: { equals: title, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('You already have a playlist with this name');
    }

    const playlist = await this.prisma.playlist.create({
      data: {
        creatorId: userId,
        title,
        description: dto.description?.trim(),
        type: dto.type,
        visibility: dto.visibility ?? Visibility.public,
        coverUrl: dto.coverUrl,
      },
    });
    return playlist;
  }

  async update(userId: string, id: string, dto: UpdatePlaylistDto) {
    await this.assertOwner(userId, id);
    if (dto.title !== undefined) {
      const title = dto.title.trim();
      const duplicate = await this.prisma.playlist.findFirst({
        where: {
          creatorId: userId,
          title: { equals: title, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new BadRequestException('You already have a playlist with this name');
      }
    }
    return this.prisma.playlist.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl || null } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.playlist.delete({ where: { id } });
    return { success: true };
  }

  async addItem(userId: string, playlistId: string, dto: AddPlaylistItemDto) {
    const playlist = await this.assertOwner(userId, playlistId);
    this.assertItemMatchesPlaylistType(playlist.type, dto.itemType);
    await this.assertContentExists(dto.itemType, dto.itemId);

    const existing = await this.prisma.playlistItem.findFirst({
      where: {
        playlistId,
        itemType: dto.itemType,
        itemId: dto.itemId,
      },
    });
    if (existing) {
      return { id: existing.id, duplicate: true };
    }

    const maxOrder = await this.prisma.playlistItem.aggregate({
      where: { playlistId },
      _max: { sortOrder: true },
    });
    const sortOrder = dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const item = await this.prisma.playlistItem.create({
      data: {
        playlistId,
        itemType: dto.itemType,
        itemId: dto.itemId,
        sortOrder,
      },
    });

    await this.prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    });

    return { id: item.id, duplicate: false };
  }

  async removeItem(userId: string, playlistId: string, itemRowId: string) {
    await this.assertOwner(userId, playlistId);
    const item = await this.prisma.playlistItem.findFirst({
      where: { id: itemRowId, playlistId },
    });
    if (!item) throw new NotFoundException('Playlist item not found');
    await this.prisma.playlistItem.delete({ where: { id: itemRowId } });
    return { success: true };
  }

  async reorder(userId: string, playlistId: string, dto: ReorderPlaylistDto) {
    await this.assertOwner(userId, playlistId);
    await this.prisma.$transaction(
      dto.items.map((row) =>
        this.prisma.playlistItem.updateMany({
          where: { id: row.id, playlistId },
          data: { sortOrder: row.sortOrder },
        }),
      ),
    );
    return { success: true };
  }

  async getOne(id: string) {
    await this.pruneOrphanedItems(id);

    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        creator: { select: { username: true, displayName: true, avatarUrl: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');

    const videoIds = playlist.items
      .filter((i) => i.itemType === PlaylistItemType.video)
      .map((i) => i.itemId);
    const episodeIds = playlist.items
      .filter((i) => i.itemType === PlaylistItemType.podcast_episode)
      .map((i) => i.itemId);

    const [videos, episodes] = await Promise.all([
      videoIds.length
        ? this.prisma.video.findMany({
            where: { id: { in: videoIds } },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              type: true,
              creator: { select: { username: true, displayName: true } },
            },
          })
        : [],
      episodeIds.length
        ? this.prisma.podcastEpisode.findMany({
            where: { id: { in: episodeIds } },
            select: {
              id: true,
              title: true,
              coverUrl: true,
              show: { select: { title: true } },
            },
          })
        : [],
    ]);

    const videoById = new Map(videos.map((v) => [v.id, v]));
    const episodeById = new Map(episodes.map((e) => [e.id, e]));

    const resolvedItems = playlist.items
      .map((item) => {
        if (item.itemType === PlaylistItemType.video) {
          const v = videoById.get(item.itemId);
          if (!v) return null;
          const channel = v.creator.displayName ?? v.creator.username;
          const href =
            v.type === 'movie'
              ? `/movie/${v.id}`
              : v.type === 'short'
                ? '/shorts'
                : `/watch/${v.id}`;
          return {
            playlistItemId: item.id,
            id: item.itemId,
            itemType: item.itemType,
            title: v.title,
            subtitle: channel,
            coverUrl: v.thumbnailUrl,
            href,
          };
        }
        const ep = episodeById.get(item.itemId);
        if (!ep) return null;
        return {
          playlistItemId: item.id,
          id: item.itemId,
          itemType: item.itemType,
          title: ep.title,
          subtitle: ep.show.title,
          coverUrl: ep.coverUrl,
          href: `/podcast/${ep.id}`,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      coverUrl: playlist.coverUrl,
      type: playlist.type,
      visibility: playlist.visibility,
      itemCount: resolvedItems.length,
      creatorSlug: playlist.creator.username,
      creatorName: playlist.creator.displayName ?? playlist.creator.username,
      items: resolvedItems,
    };
  }

  private async assertOwner(userId: string, playlistId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('Not your playlist');
    }
    return playlist;
  }

  private assertItemMatchesPlaylistType(
    playlistType: string,
    itemType: PlaylistItemType,
  ) {
    if (playlistType === 'video' && itemType !== PlaylistItemType.video) {
      throw new BadRequestException('This playlist only accepts videos');
    }
    if (
      playlistType === 'podcast' &&
      itemType !== PlaylistItemType.podcast_episode
    ) {
      throw new BadRequestException('This playlist only accepts podcast episodes');
    }
  }

  private async assertContentExists(
    itemType: PlaylistItemType,
    itemId: string,
  ) {
    if (itemType === PlaylistItemType.video) {
      const video = await this.prisma.video.findFirst({
        where: { id: itemId, status: ContentStatus.ready },
      });
      if (!video) throw new NotFoundException('Video not found');
      return;
    }
    const ep = await this.prisma.podcastEpisode.findFirst({
      where: { id: itemId, status: ContentStatus.ready },
    });
    if (!ep) throw new NotFoundException('Podcast episode not found');
  }
}
