import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';
import { StreamsModule } from '../streams/streams.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [QueueModule, StorageModule, AnalyticsModule, StreamsModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
