import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { CreatePodcastEpisodeDto } from './dto/create-episode.dto';
import { CreatePodcastShowDto } from './dto/create-show.dto';
import { UpdatePodcastEpisodeDto } from './dto/update-episode.dto';
import { PodcastUploadCompleteDto } from './dto/podcast-upload-complete.dto';
import { PodcastUploadInitDto } from './dto/podcast-upload-init.dto';
import { PodcastsService } from './podcasts.service';

@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly podcasts: PodcastsService) {}

  @Get('shows/featured')
  featured() {
    return this.podcasts.featuredShow();
  }

  @Get('shows/trending')
  trendingShows(@Query('limit') limit?: string) {
    return this.podcasts.trendingShows(limit ? parseInt(limit, 10) : 12);
  }

  @Get('shows/me')
  @UseGuards(JwtAuthGuard)
  myShows(@CurrentUser() user: AuthUserPayload) {
    return this.podcasts.listMyShows(user.id);
  }

  @Get('shows')
  shows(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.podcasts.listShows(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('shows')
  @UseGuards(JwtAuthGuard)
  createShow(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreatePodcastShowDto,
  ) {
    return this.podcasts.createShow(user.id, body);
  }

  @Get('shows/:id')
  show(@Param('id') id: string) {
    return this.podcasts.getShow(id);
  }

  @Post('shows/:id/cover/upload/init')
  @UseGuards(JwtAuthGuard)
  showCoverUploadInit(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: { mimeType: string; fileName?: string },
  ) {
    return this.podcasts.initShowCoverUpload(
      user.id,
      id,
      body.mimeType,
      body.fileName,
    );
  }

  @Post('shows/:id/cover/upload/complete')
  @UseGuards(JwtAuthGuard)
  showCoverUploadComplete(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: { objectKey: string },
  ) {
    return this.podcasts.completeShowCoverUpload(user.id, id, body.objectKey);
  }

  @Post('shows/:showId/episodes')
  @UseGuards(JwtAuthGuard)
  createEpisode(
    @CurrentUser() user: AuthUserPayload,
    @Param('showId') showId: string,
    @Body() body: CreatePodcastEpisodeDto,
  ) {
    return this.podcasts.createEpisode(user.id, showId, body);
  }

  @Get('episodes/feed')
  @UseGuards(OptionalJwtAuthGuard)
  episodesFeed(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: Request & { user?: AuthUserPayload | null },
  ) {
    return this.podcasts.episodesFeed(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      req?.user?.id,
    );
  }

  @Get('episodes/:id')
  @UseGuards(OptionalJwtAuthGuard)
  episode(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthUserPayload | null },
  ) {
    return this.podcasts.getEpisode(id, req.user?.id);
  }

  @Post('episodes/:id/play')
  play(@Param('id') id: string) {
    return this.podcasts.recordPlay(id);
  }

  @Post('episodes/:id/like')
  @UseGuards(JwtAuthGuard)
  like(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.podcasts.toggleLike(user.id, id);
  }

  @Post('episodes/:id/dislike')
  @UseGuards(JwtAuthGuard)
  dislike(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.podcasts.toggleDislike(user.id, id);
  }

  @Post('episodes/:id/save')
  @UseGuards(JwtAuthGuard)
  save(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.podcasts.toggleSave(user.id, id);
  }

  @Post('episodes/:id/upload/init')
  @UseGuards(JwtAuthGuard)
  uploadInit(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: PodcastUploadInitDto,
  ) {
    return this.podcasts.uploadInit(user.id, id, body);
  }

  @Post('episodes/:id/upload/complete')
  @UseGuards(JwtAuthGuard)
  uploadComplete(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: PodcastUploadCompleteDto,
  ) {
    return this.podcasts.uploadComplete(user.id, id, body);
  }

  @Patch('episodes/:id')
  @UseGuards(JwtAuthGuard)
  updateEpisode(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: UpdatePodcastEpisodeDto,
  ) {
    return this.podcasts.updateEpisode(user.id, id, body);
  }
}
