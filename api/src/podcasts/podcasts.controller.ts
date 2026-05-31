import { Controller, Get, Param } from '@nestjs/common';

@Controller('podcasts')
export class PodcastsController {
  @Get('shows')
  shows() {
    return { items: [], meta: { page: 1, total: 0 } };
  }

  @Get('episodes/feed')
  episodesFeed() {
    return { items: [], meta: { page: 1, total: 0 } };
  }

  @Get('episodes/:id')
  episode(@Param('id') id: string) {
    return { id, message: 'Week 7' };
  }
}
