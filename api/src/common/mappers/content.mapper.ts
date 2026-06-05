import { Prisma } from '@prisma/client';

const videoSelect = {
  id: true,
  title: true,
  thumbnailUrl: true,
  durationSeconds: true,
  viewsCount: true,
  likesCount: true,
  commentsCount: true,
  type: true,
  category: true,
  releaseYear: true,
  ageRating: true,
  tagline: true,
  hlsMasterUrl: true,
  creator: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.VideoSelect;

export type VideoWithCreator = Prisma.VideoGetPayload<{
  select: typeof videoSelect;
}>;

export function mapVideoCard(v: VideoWithCreator) {
  return {
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    durationSeconds: v.durationSeconds,
    viewsCount: v.viewsCount,
    likesCount: v.likesCount,
    commentsCount: v.commentsCount,
    type: v.type,
    category: v.category,
    releaseYear: v.releaseYear,
    ageRating: v.ageRating,
    tagline: v.tagline,
    channel: v.creator.displayName ?? v.creator.username,
    channelSlug: v.creator.username,
    creatorId: v.creator.id,
    playbackUrl: v.hlsMasterUrl,
    videoUrl: v.hlsMasterUrl,
  };
}

export const VIDEO_CARD_SELECT = videoSelect;
