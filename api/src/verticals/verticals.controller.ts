import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { AttachEpisodeVideoDto } from './dto/attach-episode-video.dto';
import { CreateVerticalEpisodeDto } from './dto/create-vertical-episode.dto';
import { CreateVerticalSeriesDto } from './dto/create-vertical-series.dto';
import { VerticalsService } from './verticals.service';

/** Micro-drama / vertical film series (9:16 episodic). */
@Controller('verticals')
export class VerticalsController {
  constructor(private readonly verticals: VerticalsService) {}

  @Get()
  list() {
    return this.verticals.listSeries();
  }

  @Get('me/series')
  @UseGuards(JwtAuthGuard)
  mySeries(@CurrentUser() user: AuthUserPayload) {
    return this.verticals.listMySeries(user.id);
  }

  @Post('series')
  @UseGuards(JwtAuthGuard)
  createSeries(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateVerticalSeriesDto,
  ) {
    return this.verticals.createSeries(user.id, body);
  }

  @Post('series/:slug/episodes')
  @UseGuards(JwtAuthGuard)
  createEpisode(
    @CurrentUser() user: AuthUserPayload,
    @Param('slug') slug: string,
    @Body() body: CreateVerticalEpisodeDto,
  ) {
    return this.verticals.createEpisode(user.id, slug, body);
  }

  @Put('episodes/:episodeId/video')
  @UseGuards(JwtAuthGuard)
  attachVideo(
    @CurrentUser() user: AuthUserPayload,
    @Param('episodeId') episodeId: string,
    @Body() body: AttachEpisodeVideoDto,
  ) {
    return this.verticals.attachEpisodeVideo(user.id, episodeId, body);
  }

  @Post('episodes/:episodeId/view')
  recordEpisodeView(@Param('episodeId') episodeId: string) {
    return this.verticals.recordEpisodeView(episodeId);
  }

  @Post('episodes/:episodeId/like')
  @UseGuards(JwtAuthGuard)
  likeEpisode(
    @CurrentUser() user: AuthUserPayload,
    @Param('episodeId') episodeId: string,
  ) {
    return this.verticals.toggleEpisodeLike(user.id, episodeId);
  }

  @Post('episodes/:episodeId/save')
  @UseGuards(JwtAuthGuard)
  saveEpisode(
    @CurrentUser() user: AuthUserPayload,
    @Param('episodeId') episodeId: string,
  ) {
    return this.verticals.toggleEpisodeSave(user.id, episodeId);
  }

  @Post('series/:seriesId/save')
  @UseGuards(JwtAuthGuard)
  saveSeries(
    @CurrentUser() user: AuthUserPayload,
    @Param('seriesId') seriesId: string,
  ) {
    return this.verticals.toggleSeriesSave(user.id, seriesId);
  }

  @Get(':slug/episodes/:episodeNumber')
  @UseGuards(OptionalJwtAuthGuard)
  episode(
    @Param('slug') slug: string,
    @Param('episodeNumber', ParseIntPipe) episodeNumber: number,
    @Req() req: Request & { user?: AuthUserPayload | null },
  ) {
    return this.verticals.getEpisode(slug, episodeNumber, req.user?.id);
  }

  @Get(':slug')
  series(@Param('slug') slug: string) {
    return this.verticals.getSeries(slug);
  }
}
