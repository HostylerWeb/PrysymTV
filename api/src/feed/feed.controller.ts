import { Controller, Get } from '@nestjs/common';

/** Week 7 — aggregated home feed */
@Controller('feed')
export class FeedController {
  @Get('home')
  home() {
    return {
      liveNow: [],
      continueWatching: [],
      featuredLive: null,
      trending: [],
      newReleases: [],
      message: 'Implement GET /feed/home aggregation (Week 7)',
    };
  }

  @Get('trending')
  trending() {
    return { items: [], meta: { page: 1, total: 0 } };
  }
}
