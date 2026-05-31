import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';

@Controller('videos')
export class VideosController {
  @Post('upload/init')
  @UseGuards(JwtAuthGuard)
  uploadInit(
    @CurrentUser() _user: AuthUserPayload,
    @Body() _body: Record<string, unknown>,
  ) {
    return { tusUrl: null, uploadId: null, message: 'TUS upload — Week 2' };
  }

  @Post('upload/complete')
  @UseGuards(JwtAuthGuard)
  uploadComplete(
    @CurrentUser() _user: AuthUserPayload,
    @Body() _body: Record<string, unknown>,
  ) {
    return { videoId: null, status: 'processing', message: 'Week 2' };
  }

  @Get('feed/shorts')
  shortsFeed(@Query('cursor') _cursor?: string) {
    return { items: [], nextCursor: null };
  }

  @Get('feed/movies')
  moviesFeed() {
    return { items: [], meta: { page: 1, total: 0 } };
  }

  @Get('feed/movies/featured')
  featuredMovie() {
    return { item: null };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return { id, message: 'Week 3 — video detail' };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@Param('id') _id: string, @CurrentUser() _user: AuthUserPayload) {
    return { liked: true, message: 'Week 3' };
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  save(@Param('id') _id: string, @CurrentUser() _user: AuthUserPayload) {
    return { saved: true, message: 'Week 3' };
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  report(
    @Param('id') _id: string,
    @CurrentUser() _user: AuthUserPayload,
    @Body() _body: Record<string, unknown>,
  ) {
    return { success: true, message: 'Week 3' };
  }
}
