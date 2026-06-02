import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
  ) {
    return this.searchService.search(q ?? '', type, page ? parseInt(page, 10) : 1);
  }

  @Get('suggest')
  suggest(@Query('q') q?: string) {
    return this.searchService.suggest(q ?? '');
  }
}
