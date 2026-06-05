import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateCommentDto } from './dto/create-comment.dto';
import { UploadCompleteDto } from './dto/upload-complete.dto';
import { UploadInitDto } from './dto/upload-init.dto';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Post('upload/init')
  @UseGuards(JwtAuthGuard)
  uploadInit(@CurrentUser() user: AuthUserPayload, @Body() body: UploadInitDto) {
    return this.videos.uploadInit(user.id, body);
  }

  @Post('upload/complete')
  @UseGuards(JwtAuthGuard)
  uploadComplete(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: UploadCompleteDto,
  ) {
    return this.videos.uploadComplete(user.id, body);
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

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  likeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.videos.toggleCommentLike(user.id, commentId);
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
  recordView(@Param('id') id: string) {
    return this.videos.recordView(id);
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
}
