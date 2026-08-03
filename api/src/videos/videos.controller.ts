import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UploadCompleteDto } from './dto/upload-complete.dto';
import { UploadInitDto } from './dto/upload-init.dto';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Post('upload/init')
  @UseGuards(JwtAuthGuard)
  uploadInit(@CurrentUser() user: AuthUserPayload, @Body() body: UploadInitDto) {
    return this.videos.uploadInit(user, body);
  }

  @Post('upload/complete')
  @UseGuards(JwtAuthGuard)
  uploadComplete(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: UploadCompleteDto,
  ) {
    return this.videos.uploadComplete(user.id, body);
  }

  @Post('upload/abandon')
  @UseGuards(JwtAuthGuard)
  abandonUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { videoId: string },
  ) {
    return this.videos.abandonUpload(user.id, body.videoId);
  }

  @Post(':id/poster/upload/init')
  @UseGuards(JwtAuthGuard)
  posterUploadInit(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { mimeType: string; fileName?: string },
  ) {
    return this.videos.initMoviePosterUpload(
      user,
      id,
      body.mimeType,
      body.fileName,
    );
  }

  @Post(':id/poster/upload/complete')
  @UseGuards(JwtAuthGuard)
  posterUploadComplete(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { objectKey: string },
  ) {
    return this.videos.completeMoviePosterUpload(user, id, body.objectKey);
  }

  @Get('feed/shorts')
  @UseGuards(OptionalJwtAuthGuard)
  shortsFeed(
    @Query('cursor') cursor?: string,
    @Req() req?: Request & { user?: AuthUserPayload | null },
  ) {
    return this.videos.shortsFeed(cursor, 20, req?.user?.id);
  }

  @Get('feed/movies')
  moviesFeed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.videos.moviesFeed(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }

  @Get('feed/movies/featured')
  featuredMovie() {
    return this.videos.featuredMovie();
  }

  @Get('feed/videos')
  @UseGuards(OptionalJwtAuthGuard)
  videosBrowse(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vertical') vertical?: string,
    @Query('sort') sort?: string,
    @Query('mode') mode?: string,
    @Query('q') q?: string,
    @Req() req?: Request & { user?: AuthUserPayload | null },
  ) {
    return this.videos.videosBrowseFeed({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 24,
      vertical,
      sort,
      mode,
      q,
      viewerId: req?.user?.id,
    });
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  likeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.videos.toggleCommentLike(user.id, commentId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  removeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.videos.deleteComment(user.id, commentId);
  }

  @Get(':id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  comments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Req() req?: Request & { user?: AuthUserPayload | null },
  ) {
    return this.videos.listComments(
      id,
      page ? parseInt(page, 10) : 1,
      30,
      req?.user?.id,
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateCommentDto,
  ) {
    return this.videos.createComment(user.id, id, body.body, body.parentId);
  }

  @Post(':id/view')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  recordView(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthUserPayload | null },
    @Headers('x-country-code') countryCode?: string,
  ) {
    const viewerKey =
      req.ip ||
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined);
    return this.videos.recordView(id, req.user?.id, countryCode, viewerKey);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOne(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthUserPayload | null },
  ) {
    return this.videos.getOne(id, req.user?.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@Param('id') id: string, @CurrentUser() user: AuthUserPayload) {
    return this.videos.toggleLike(user.id, id);
  }

  @Post(':id/dislike')
  @UseGuards(JwtAuthGuard)
  dislike(@Param('id') id: string, @CurrentUser() user: AuthUserPayload) {
    return this.videos.toggleDislike(user.id, id);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  save(@Param('id') id: string, @CurrentUser() user: AuthUserPayload) {
    return this.videos.toggleSave(user.id, id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  report(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { reason?: string; details?: string },
  ) {
    return this.videos.report(user.id, id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateOwned(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() body: UpdateVideoDto,
  ) {
    return this.videos.updateOwned(user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteOwned(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.videos.deleteOwned(user.id, id);
  }
}
