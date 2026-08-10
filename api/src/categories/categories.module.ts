import { Module } from '@nestjs/common';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { ContentServiceGuard } from '../common/guards/content-service.guard';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [PlatformSettingsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, ContentServiceGuard],
  exports: [CategoriesService],
})
export class CategoriesModule {}
