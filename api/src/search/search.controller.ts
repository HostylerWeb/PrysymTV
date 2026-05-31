import { Controller, Get, Query } from '@nestjs/common';

@Controller('search')
export class SearchController {
  @Get()
  search(@Query('q') q?: string, @Query('type') _type?: string) {
    return {
      query: q ?? '',
      videos: [],
      creators: [],
      podcasts: [],
      streams: [],
    };
  }

  @Get('suggest')
  suggest(@Query('q') q?: string) {
    return { query: q ?? '', suggestions: [] };
  }
}
