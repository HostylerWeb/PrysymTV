import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get('home')
  @UseGuards(OptionalJwtAuthGuard)
  home(@CurrentUser() user?: AuthUserPayload | null) {
    return this.feed.home(user?.id);
  }

  @Get('trending')
  trending(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.feed.trending(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
