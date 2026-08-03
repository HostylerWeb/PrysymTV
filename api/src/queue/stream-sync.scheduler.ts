import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { STREAM_SYNC_QUEUE } from './queue.constants';

@Injectable()
export class StreamSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(StreamSyncScheduler.name);

  constructor(
    @InjectQueue(STREAM_SYNC_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    await this.queue.add(
      'sync',
      {},
      {
        repeat: { every: 30_000 },
        jobId: 'stream-sync-repeat',
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
    this.logger.log('Registered stream sync job (every 30s)');
  }
}
