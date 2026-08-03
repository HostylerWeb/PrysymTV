import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StreamsService } from '../streams/streams.service';
import { STREAM_SYNC_QUEUE } from './queue.constants';

@Processor(STREAM_SYNC_QUEUE)
export class StreamSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(StreamSyncProcessor.name);

  constructor(private readonly streams: StreamsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'sync') return;
    try {
      await this.streams.syncStreamsFromIngest();
    } catch (err) {
      this.logger.warn(`Stream sync job failed: ${String(err)}`);
      throw err;
    }
  }
}
