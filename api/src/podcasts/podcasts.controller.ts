import { Controller, Get, Param, Query } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';

@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly podcasts: PodcastsService) {}

  @Get('shows')
  shows(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.podcasts.listShows(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('episodes/feed')
  episodesFeed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.podcasts.episodesFeed(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('episodes/:id')
  episode(@Param('id') id: string) {
    return this.podcasts.getEpisode(id);
  }
}
