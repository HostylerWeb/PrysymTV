import { MOCK_IMAGES, mockMoviePoster, mockVerticalPoster } from '@/lib/mock-images';

export type MockServedAd = {
  id: string;
  title: string;
  mediaUrl: string;
  clickThroughUrl: string;
  skipAfterSeconds: number;
};

export const MOCK_HOME_BANNER_AD: MockServedAd = {
  id: 'ad-home-1',
  title: 'Stream smarter with Prysym Premium',
  mediaUrl: MOCK_IMAGES.banner,
  clickThroughUrl: 'https://prysym.tv/premium',
  skipAfterSeconds: 0,
};

export const MOCK_SHORTS_AD: MockServedAd = {
  id: 'ad-shorts-1',
  title: 'Upgrade your watch experience',
  mediaUrl: MOCK_IMAGES.sports[0],
  clickThroughUrl: 'https://prysym.tv/advertise',
  skipAfterSeconds: 5,
};

export const MOCK_MOVIE_PREROLL_AD: MockServedAd = {
  id: 'ad-movie-1',
  title: '',
  mediaUrl: mockMoviePoster(0),
  clickThroughUrl: 'https://prysym.tv/movies',
  skipAfterSeconds: 5,
};

export const MOCK_VERTICAL_AD: MockServedAd = {
  id: 'ad-vertical-1',
  title: 'Binge the latest micro-dramas',
  mediaUrl: mockVerticalPoster(0),
  clickThroughUrl: 'https://prysym.tv/verticals',
  skipAfterSeconds: 5,
};

export const MOCK_PODCAST_AD: MockServedAd = {
  id: 'ad-podcast-1',
  title: 'Discover top podcasts on Prysym',
  mediaUrl: MOCK_IMAGES.podcast[0],
  clickThroughUrl: 'https://prysym.tv/podcasts',
  skipAfterSeconds: 5,
};
