import { Module } from '@nestjs/common';
import { ContentServiceGuard } from '../common/guards/content-service.guard';
import { PlaylistsModule } from '../playlists/playlists.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';

@Module({
  imports: [PrismaModule, StorageModule, PlaylistsModule],
  controllers: [PodcastsController],
  providers: [PodcastsService, ContentServiceGuard],
  exports: [PodcastsService],
})
export class PodcastsModule {}
