import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { VerticalsService } from './verticals.service';

/** Micro-drama / vertical film series (9:16 episodic). */
@Controller('verticals')
export class VerticalsController {
  constructor(private readonly verticals: VerticalsService) {}

  @Get()
  list() {
    return this.verticals.listSeries();
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
