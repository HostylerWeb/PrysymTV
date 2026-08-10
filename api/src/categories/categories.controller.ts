import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequireContentService } from '../common/decorators/require-content-service.decorator';
import { ContentServiceGuard } from '../common/guards/content-service.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get('videos')
  @UseGuards(ContentServiceGuard)
  @RequireContentService('videos')
  listVideos() {
    return this.categories.listVideoCategories();
  }

  @Get('podcasts')
  @UseGuards(ContentServiceGuard)
  @RequireContentService('podcasts')
  listPodcasts() {
    return this.categories.listPodcastCategories();
  }

  @Get('movies')
  @UseGuards(ContentServiceGuard)
  @RequireContentService('movies')
  listMovies() {
    return this.categories.listMovieGenres();
  }
}
