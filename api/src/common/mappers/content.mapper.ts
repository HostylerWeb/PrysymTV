import { Prisma } from '@prisma/client';

const videoSelect = {
  id: true,
  title: true,
  thumbnailUrl: true,
  posterUrl: true,
  durationSeconds: true,
  viewsCount: true,
  likesCount: true,
  commentsCount: true,
  type: true,
  category: true,
  vertical: true,
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

export const VIDEO_CARD_SELECT = videoSelect;
