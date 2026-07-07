import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus, VideoType } from '@prisma/client';
import { Job } from 'bullmq';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { getVideoProcessingSettings } from '../config/storage-env';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  extractThumbnail,
  probeMedia,
  transcodeToHls,
  uploadHlsDirectory,
} from './ffmpeg.util';
import { VIDEO_PROCESSING_QUEUE } from './queue.constants';

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
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  private resolveFfprobePath(ffmpegPath: string): string {
    const explicit = this.config.get<string>('FFPROBE_PATH')?.trim();
    if (explicit) return explicit;
    if (ffmpegPath.toLowerCase().endsWith('ffmpeg')) {
      return ffmpegPath.replace(/ffmpeg$/i, 'ffprobe');
    }
    return 'ffprobe';
  }

  async process(job: Job<VideoProcessingJobData>): Promise<void> {
    const { videoId, objectKey } = job.data;
    const settings = getVideoProcessingSettings(this.config);
    const ffprobePath = this.resolveFfprobePath(settings.ffmpegPath);
    this.logger.log(
      `Processing video ${videoId} mode=${settings.mode} (attempt ${job.attemptsMade + 1})`,
    );

    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      this.logger.warn(`Video ${videoId} not found, skipping job`);
      return;
    }

    try {
      if (settings.mode === 'skip') {
        await this.processSkipMode(videoId, objectKey, settings.ffmpegPath, ffprobePath);
        return;
      }
      const isShort = video.type === VideoType.short;
      if (isShort) {
        this.logger.log(`Video ${videoId}: shorts profile (single 720p HLS)`);
      }
      await this.processFfmpegMode(
        videoId,
        objectKey,
        settings.ffmpegPath,
        ffprobePath,
        settings.tmpDir,
        isShort ? 'single' : 'adaptive',
      );
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

  private async processSkipMode(
    videoId: string,
    objectKey: string,
    ffmpegPath: string,
    ffprobePath: string,
  ) {
    const rawUrl = this.storage.getPublicUrl(objectKey);
    let durationSeconds = 0;
    let thumbnailUrl = rawUrl;

    const workRoot = await mkdtemp(join(tmpdir(), `prysym-skip-${videoId}-`));
    const inputPath = join(workRoot, 'source');
    const thumbPath = join(workRoot, 'thumb.jpg');

    try {
      await this.storage.downloadToFile(objectKey, inputPath);
      const probe = await probeMedia(inputPath, ffprobePath);
      durationSeconds = probe.durationSeconds;

      if (probe.hasVideo) {
        await extractThumbnail(inputPath, thumbPath, ffmpegPath, true);
        const thumbKey = this.storage.buildThumbnailKey(videoId);
        await this.storage.uploadFromFile(thumbKey, thumbPath, 'image/jpeg');
        thumbnailUrl = this.storage.getPublicUrl(thumbKey);
      }
    } catch (e) {
      this.logger.warn(
        `Skip mode probe/thumb failed for ${videoId}: ${e instanceof Error ? e.message : e}`,
      );
    } finally {
      await rm(workRoot, { recursive: true, force: true });
    }

    const prior = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: {
        status: true,
        creatorId: true,
        title: true,
        visibility: true,
        type: true,
        verticalEpisodeId: true,
      },
    });

    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        status: ContentStatus.ready,
        hlsMasterUrl: objectKey,
        thumbnailUrl,
        durationSeconds,
      },
    });

    if (
      prior &&
      prior.status !== ContentStatus.ready &&
      prior.visibility === 'public'
    ) {
      void this.notifyUploadFollowers(videoId, prior);
    }
    this.logger.log(`Video ${videoId} ready (processing mode: skip)`);
  }

  private async notifyUploadFollowers(
    videoId: string,
    prior: {
      creatorId: string;
      title: string;
      type: VideoType;
      verticalEpisodeId: string | null;
    },
  ) {
    if (prior.verticalEpisodeId) {
      const episode = await this.prisma.verticalEpisode.findUnique({
        where: { id: prior.verticalEpisodeId },
        include: { series: { select: { slug: true } } },
      });
      if (episode?.series?.slug) {
        void this.notifications.notifyFollowersOfVerticalEpisode(
          prior.creatorId,
          episode.id,
          prior.title,
          episode.series.slug,
          episode.episodeNumber,
          videoId,
        );
        return;
      }
    }
    void this.notifications.notifyFollowersOfUpload(
      prior.creatorId,
      videoId,
      prior.title,
      prior.type,
    );
  }

  private async processFfmpegMode(
    videoId: string,
    objectKey: string,
    ffmpegPath: string,
    ffprobePath: string,
    tmpDirOverride: string,
    profile: 'adaptive' | 'single' = 'adaptive',
  ) {
    const workRoot = tmpDirOverride
      ? join(tmpDirOverride, videoId)
      : await mkdtemp(join(tmpdir(), `prysym-video-${videoId}-`));
    const inputPath = join(workRoot, 'source');
    const hlsDir = join(workRoot, 'hls');
    const thumbPath = join(workRoot, 'thumb.jpg');

    try {
      const { mkdir } = await import('fs/promises');
      await this.storage.downloadToFile(objectKey, inputPath);
      await mkdir(hlsDir, { recursive: true });

      const probe = await transcodeToHls(
        inputPath,
        hlsDir,
        ffmpegPath,
        ffprobePath,
        profile,
        720,
      );

      if (probe.hasVideo) {
        await extractThumbnail(inputPath, thumbPath, ffmpegPath, true);
      }

      const hlsPrefix = this.storage.buildHlsPrefix(videoId);
      await uploadHlsDirectory(hlsDir, hlsPrefix, (key, localPath, contentType) =>
        this.storage.uploadFromFile(key, localPath, contentType),
      );

      const thumbKey = this.storage.buildThumbnailKey(videoId);
      let thumbnailUrl: string | null = null;
      if (probe.hasVideo) {
        await this.storage.uploadFromFile(thumbKey, thumbPath, 'image/jpeg');
        thumbnailUrl = this.storage.getPublicUrl(thumbKey);
      } else if (probe.isAudioOnly) {
        thumbnailUrl = null;
      }

      const masterKey = this.storage.buildHlsMasterKey(videoId);
      const prior = await this.prisma.video.findUnique({
        where: { id: videoId },
        select: {
          status: true,
          creatorId: true,
          title: true,
          visibility: true,
          type: true,
          verticalEpisodeId: true,
        },
      });

      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          status: ContentStatus.ready,
          hlsMasterUrl: masterKey,
          thumbnailUrl,
          durationSeconds: probe.durationSeconds,
        },
      });

      if (
        prior &&
        prior.status !== ContentStatus.ready &&
        prior.visibility === 'public'
      ) {
        void this.notifyUploadFollowers(videoId, prior);
      }

      if (this.storage.getSettings().driver === 's3') {
        await this.storage.deleteObject(objectKey);
      }
      this.logger.log(`Video ${videoId} transcoded (${probe.durationSeconds}s) and published`);
    } finally {
      if (!tmpDirOverride) {
        await rm(workRoot, { recursive: true, force: true });
      }
    }
  }
}
