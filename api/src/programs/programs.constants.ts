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
    href: '/videos?category=sports',
  },
  {
    slug: 'concerts',
    vertical: ContentVertical.concert,
    label: 'Concerts',
    description: 'Live and on-demand concert experiences',
    href: '/videos?category=concerts',
  },
  {
    slug: 'community',
    vertical: ContentVertical.community_event,
    label: 'Community Events',
    description: 'Local and community programming',
    href: '/videos?category=community',
  },
  {
    slug: 'education',
    vertical: ContentVertical.education,
    label: 'Educational Programs',
    description: 'Courses, workshops, and learning content',
    href: '/videos?category=education',
  },
  {
    slug: 'cooking',
    vertical: ContentVertical.general,
    label: 'Cooking',
    description: 'Recipes, kitchen tutorials, and food culture',
    href: '/videos?category=cooking',
  },
  {
    slug: 'coaching',
    vertical: ContentVertical.education,
    label: 'Coaching',
    description: 'Life, career, and skills coaching from creators',
    href: '/videos?category=coaching',
  },
  {
    slug: 'fitness',
    vertical: ContentVertical.sports,
    label: 'Fitness & Wellness',
    description: 'Workouts, yoga, nutrition, and healthy living',
    href: '/videos?category=fitness',
  },
  {
    slug: 'gaming',
    vertical: ContentVertical.general,
    label: 'Gaming',
    description: 'Gameplay, esports, reviews, and gaming culture',
    href: '/videos?category=gaming',
  },
  {
    slug: 'music',
    vertical: ContentVertical.concert,
    label: 'Music',
    description: 'Performances, music videos, and artist content',
    href: '/videos?category=music',
  },
  {
    slug: 'technology',
    vertical: ContentVertical.education,
    label: 'Technology',
    description: 'Tech reviews, tutorials, and industry news',
    href: '/videos?category=technology',
  },
  {
    slug: 'news',
    vertical: ContentVertical.general,
    label: 'News & Commentary',
    description: 'Current events, analysis, and opinion',
    href: '/videos?category=news',
  },
  {
    slug: 'comedy',
    vertical: ContentVertical.general,
    label: 'Comedy',
    description: 'Stand-up, sketches, improv, and humor',
    href: '/videos?category=comedy',
  },
  {
    slug: 'travel',
    vertical: ContentVertical.general,
    label: 'Travel & Adventure',
    description: 'Destinations, vlogs, and outdoor exploration',
    href: '/videos?category=travel',
  },
  {
    slug: 'fashion',
    vertical: ContentVertical.general,
    label: 'Fashion & Beauty',
    description: 'Style, makeup, trends, and lifestyle',
    href: '/videos?category=fashion',
  },
];

export function programBySlug(slug: string): ProgramMeta | undefined {
  return PLATFORM_PROGRAMS.find((p) => p.slug === slug);
}
