import {
  DislikeTargetType,
  LikeTargetType,
  SavedItemType,
  VideoType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ViewerVideoFlags = {
  liked: boolean;
  saved: boolean;
  disliked: boolean;
};

export function savedItemTypeForVideo(type: VideoType): SavedItemType {
  return type === VideoType.movie ? SavedItemType.movie : SavedItemType.video;
}

export async function getViewerVideoFlags(
  prisma: PrismaService,
  userId: string | undefined,
  videoId: string,
  videoType: VideoType,
): Promise<ViewerVideoFlags> {
  if (!userId) {
    return { liked: false, saved: false, disliked: false };
  }

  const itemType = savedItemTypeForVideo(videoType);
  const [like, save, dislike] = await Promise.all([
    prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: LikeTargetType.video,
          targetId: videoId,
        },
      },
    }),
    prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: { userId, itemType, itemId: videoId },
      },
    }),
    prisma.dislike.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: DislikeTargetType.video,
          targetId: videoId,
        },
      },
    }),
  ]);

  return {
    liked: !!like,
    saved: !!save,
    disliked: !!dislike,
  };
}

export async function enrichVideoCardsForViewer(
  prisma: PrismaService,
  userId: string | undefined,
  videoIds: string[],
  typesById: Map<string, VideoType>,
): Promise<Map<string, ViewerVideoFlags>> {
  const flags = new Map<string, ViewerVideoFlags>();
  if (!userId || videoIds.length === 0) {
    for (const id of videoIds) {
      flags.set(id, { liked: false, saved: false, disliked: false });
    }
    return flags;
  }

  const [likes, saves, dislikes] = await Promise.all([
    prisma.like.findMany({
      where: {
        userId,
        targetType: LikeTargetType.video,
        targetId: { in: videoIds },
      },
    }),
    prisma.savedItem.findMany({
      where: {
        userId,
        itemId: { in: videoIds },
        itemType: { in: [SavedItemType.video, SavedItemType.movie] },
      },
    }),
    prisma.dislike.findMany({
      where: {
        userId,
        targetType: DislikeTargetType.video,
        targetId: { in: videoIds },
      },
    }),
  ]);

  const likedIds = new Set(likes.map((l) => l.targetId));
  const dislikedIds = new Set(dislikes.map((d) => d.targetId));

  for (const id of videoIds) {
    const type = typesById.get(id) ?? VideoType.video;
    const itemType = savedItemTypeForVideo(type);
    const saved = saves.some(
      (s) => s.itemId === id && s.itemType === itemType,
    );
    flags.set(id, {
      liked: likedIds.has(id),
      saved,
      disliked: dislikedIds.has(id),
    });
  }

  return flags;
}

/** Whether the viewer follows each creator (by creator user id). */
export async function enrichCreatorFollowForViewer(
  prisma: PrismaService,
  userId: string | undefined,
  creatorIds: string[],
): Promise<Map<string, boolean>> {
  const uniqueIds = [...new Set(creatorIds)];
  const result = new Map<string, boolean>();
  if (!userId || uniqueIds.length === 0) {
    for (const id of uniqueIds) result.set(id, false);
    return result;
  }

  const follows = await prisma.follow.findMany({
    where: {
      followerId: userId,
      followingId: { in: uniqueIds },
    },
    select: { followingId: true },
  });
  const followed = new Set(follows.map((f) => f.followingId));
  for (const id of uniqueIds) {
    result.set(id, followed.has(id));
  }
  return result;
}

export async function getLikedCommentIds(
  prisma: PrismaService,
  userId: string | undefined,
  commentIds: string[],
): Promise<Set<string>> {
  if (!userId || commentIds.length === 0) return new Set();

  const likes = await prisma.like.findMany({
    where: {
      userId,
      targetType: LikeTargetType.comment,
      targetId: { in: commentIds },
    },
  });
  return new Set(likes.map((l) => l.targetId));
}
