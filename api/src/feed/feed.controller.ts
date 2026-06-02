import { Controller, Get, Query } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get('home')
  home() {
    return this.feed.home();
  }

  @Get('trending')
  trending(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.feed.trending(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
