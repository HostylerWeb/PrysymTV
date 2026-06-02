import { ContentVertical } from '@prisma/client';

export type ProgramMeta = {
  slug: string;
  vertical: ContentVertical;
  label: string;
  description: string;
  href: string;
};

/** Founder content program pillars (not micro-drama "vertical films"). */
export const PLATFORM_PROGRAMS: ProgramMeta[] = [
  {
    slug: 'podcasts',
    vertical: ContentVertical.podcast,
    label: 'Podcasts',
    description: 'Shows and audio episodes from creators',
    href: '/podcasts',
  },
  {
    slug: 'sports',
    vertical: ContentVertical.sports,
    label: 'Sports',
    description: 'Live games, highlights, and sports talk',
    href: '/programs/sports',
  },
  {
    slug: 'concerts',
    vertical: ContentVertical.concert,
    label: 'Concerts',
    description: 'Live and on-demand concert experiences',
    href: '/programs/concerts',
  },
  {
    slug: 'community',
    vertical: ContentVertical.community_event,
    label: 'Community Events',
    description: 'Local and community programming',
    href: '/programs/community',
  },
  {
    slug: 'education',
    vertical: ContentVertical.education,
    label: 'Educational Programs',
    description: 'Courses, workshops, and learning content',
    href: '/programs/education',
  },
];

export function programBySlug(slug: string): ProgramMeta | undefined {
  return PLATFORM_PROGRAMS.find((p) => p.slug === slug);
}
