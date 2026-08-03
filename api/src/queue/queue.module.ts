import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getVideoProcessingSettings } from '../config/storage-env';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { StreamsModule } from '../streams/streams.module';
import { STREAM_SYNC_QUEUE, VIDEO_PROCESSING_QUEUE } from './queue.constants';
import { StreamSyncProcessor } from './stream-sync.processor';
import { StreamSyncScheduler } from './stream-sync.scheduler';
import { VideoProcessingProcessor } from './video-processing.processor';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    StreamsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueueAsync({
      name: VIDEO_PROCESSING_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const { maxRetries } = getVideoProcessingSettings(config);
        return {
          defaultJobOptions: {
            attempts: maxRetries,
            backoff: { type: 'exponential' as const, delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: STREAM_SYNC_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 50,
      },
    }),
  ],
  providers: [VideoProcessingProcessor, StreamSyncProcessor, StreamSyncScheduler],
  exports: [BullModule],
})
export class QueueModule {}
