import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { execFile } from 'child_process';
import { mkdtemp, readdir, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { getVideoProcessingSettings } from '../config/storage-env';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { VIDEO_PROCESSING_QUEUE } from './queue.constants';

const execFileAsync = promisify(execFile);

export type VideoProcessingJobData = {
  videoId: string;
  objectKey: string;
};

@Processor(VIDEO_PROCESSING_QUEUE)
export class VideoProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<VideoProcessingJobData>): Promise<void> {
    const { videoId, objectKey } = job.data;
    const settings = getVideoProcessingSettings(this.config);
    this.logger.log(`Processing video ${videoId} (attempt ${job.attemptsMade + 1})`);

    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      this.logger.warn(`Video ${videoId} not found, skipping job`);
      return;
    }

    try {
      if (settings.mode === 'skip') {
        await this.processSkipMode(videoId, objectKey);
        return;
      }
      await this.processFfmpegMode(videoId, objectKey, settings.ffmpegPath, settings.tmpDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Video ${videoId} processing failed: ${message}`);
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: ContentStatus.failed },
      });
      throw err;
    }
  }

  private async processSkipMode(videoId: string, objectKey: string) {
    const rawUrl = this.storage.getPublicUrl(objectKey);
    const thumbKey = this.storage.buildThumbnailKey(videoId);
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        status: ContentStatus.ready,
        hlsMasterUrl: rawUrl,
        thumbnailUrl: rawUrl,
      },
    });
    this.logger.log(`Video ${videoId} ready (processing mode: skip)`);
    void thumbKey;
  }

  private async processFfmpegMode(
    videoId: string,
    objectKey: string,
    ffmpegPath: string,
    tmpDirOverride: string,
  ) {
    const workRoot = tmpDirOverride
      ? join(tmpDirOverride, videoId)
      : await mkdtemp(join(tmpdir(), `prysym-video-${videoId}-`));
    const inputPath = join(workRoot, 'source');
    const hlsDir = join(workRoot, 'hls');
    const thumbPath = join(workRoot, 'thumb.jpg');

    try {
      await this.storage.downloadToFile(objectKey, inputPath);
      const { mkdir } = await import('fs/promises');
      await mkdir(hlsDir, { recursive: true });

      await execFileAsync(ffmpegPath, [
        '-y',
        '-i',
        inputPath,
        '-codec',
        'copy',
        '-start_number',
        '0',
        '-hls_time',
        '10',
        '-hls_list_size',
        '0',
        '-f',
        'hls',
        join(hlsDir, 'master.m3u8'),
      ]);

      await execFileAsync(ffmpegPath, [
        '-y',
        '-ss',
        '00:00:02',
        '-i',
        inputPath,
        '-vframes',
        '1',
        thumbPath,
      ]);

      const hlsPrefix = `${this.storage.buildHlsMasterKey(videoId).replace(/\/master\.m3u8$/, '')}`;
      const files = await readdir(hlsDir);
      for (const file of files) {
        const localFile = join(hlsDir, file);
        const st = await stat(localFile);
        if (!st.isFile()) continue;
        const contentType = file.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : 'video/mp2t';
        await this.storage.uploadFromFile(`${hlsPrefix}/${file}`, localFile, contentType);
      }

      const thumbKey = this.storage.buildThumbnailKey(videoId);
      await this.storage.uploadFromFile(thumbKey, thumbPath, 'image/jpeg');

      const masterKey = this.storage.buildHlsMasterKey(videoId);
      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          status: ContentStatus.ready,
          hlsMasterUrl: this.storage.getPublicUrl(masterKey),
          thumbnailUrl: this.storage.getPublicUrl(thumbKey),
        },
      });

      if (this.storage.getSettings().driver === 's3') {
        await this.storage.deleteObject(objectKey);
      }

      this.logger.log(`Video ${videoId} transcoded and published`);
    } finally {
      if (!tmpDirOverride) {
        await rm(workRoot, { recursive: true, force: true });
      }
    }
  }
}
