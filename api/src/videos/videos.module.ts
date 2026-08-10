import { Module } from '@nestjs/common';
import { ContentServiceGuard } from '../common/guards/content-service.guard';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';
import { StreamsModule } from '../streams/streams.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [QueueModule, StorageModule, AnalyticsModule, StreamsModule, PlaylistsModule],
  controllers: [VideosController],
  providers: [VideosService, ContentServiceGuard],
  exports: [VideosService],
})
export class VideosModule {}
