import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get('videos')
  listVideos() {
    return this.categories.listVideoCategories();
  }

  @Get('podcasts')
  listPodcasts() {
    return this.categories.listPodcastCategories();
  }
}
