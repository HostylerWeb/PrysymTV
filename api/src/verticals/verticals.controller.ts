import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
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

  @Get(':slug/episodes/:episodeNumber')
  episode(
    @Param('slug') slug: string,
    @Param('episodeNumber', ParseIntPipe) episodeNumber: number,
  ) {
    return this.verticals.getEpisode(slug, episodeNumber);
  }

  @Get(':slug')
  series(@Param('slug') slug: string) {
    return this.verticals.getSeries(slug);
  }
}
