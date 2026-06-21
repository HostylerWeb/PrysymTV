import { ContentVertical } from '@prisma/client';

/** Maps upload/browse category slugs to ContentVertical. */
const CATEGORY_TO_VERTICAL: Record<string, ContentVertical> = {
  general: ContentVertical.general,
  sports: ContentVertical.sports,
  concerts: ContentVertical.concert,
  community: ContentVertical.community_event,
  education: ContentVertical.education,
  cooking: ContentVertical.general,
  coaching: ContentVertical.education,
  fitness: ContentVertical.sports,
  gaming: ContentVertical.general,
  music: ContentVertical.concert,
  technology: ContentVertical.education,
  news: ContentVertical.general,
  comedy: ContentVertical.general,
  travel: ContentVertical.general,
  fashion: ContentVertical.general,
  podcast: ContentVertical.podcast,
};

export function verticalFromCategorySlug(
  slug?: string | null,
): ContentVertical | undefined {
  if (!slug) return undefined;
  return CATEGORY_TO_VERTICAL[slug.trim().toLowerCase()];
}

export function categorySlugsForVertical(vertical: ContentVertical): string[] {
  return Object.entries(CATEGORY_TO_VERTICAL)
    .filter(([, v]) => v === vertical)
    .map(([slug]) => slug);
}
