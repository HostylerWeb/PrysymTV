import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { mkdirSync } from 'fs';
import { rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const videoUploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(tmpdir(), 'prysym-video-uploads');
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname?.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : '.mp4';
    cb(null, `${randomUUID()}${ext}`);
  },
});

/** Multipart video upload (local disk or S3/R2 via API). */
@Controller('media')
export class MediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload/:videoId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: videoUploadStorage,
      limits: {
        fileSize: Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 ** 3),
      },
    }),
  )
  async uploadRaw(
    @Param('videoId') videoId: string,
    @CurrentUser() user: AuthUserPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.path) {
      throw new ForbiddenException('Missing file');
    }

    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');
    if (video.creatorId !== user.id) {
      throw new ForbiddenException('Not your upload');
    }

    const max = this.storage.getSettings().maxUploadBytes;
    if (file.size > max) {
      await rm(file.path, { force: true }).catch(() => undefined);
      throw new ForbiddenException('File exceeds maximum upload size');
    }

    const objectKey =
      video.rawObjectKey ?? this.storage.buildRawKey(videoId, file.originalname);

    try {
      const mimeType = file.mimetype?.trim() || 'application/octet-stream';
      if (this.storage.getSettings().driver === 'local') {
        const { readFile } = await import('fs/promises');
        const buffer = await readFile(file.path);
        await this.storage.writeLocalRaw(videoId, objectKey, buffer);
      } else {
        await this.storage.uploadFromFile(objectKey, file.path, mimeType);
      }
    } finally {
      await rm(file.path, { force: true }).catch(() => undefined);
    }

    if (!video.rawObjectKey) {
      await this.prisma.video.update({
        where: { id: videoId },
        data: { rawObjectKey: objectKey },
      });
    }
    return { success: true, objectKey, bytes: file.size };
  }

  @Post('profile-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async profileUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body('objectKey') objectKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length || !objectKey?.trim()) {
      throw new ForbiddenException('Missing file or objectKey');
    }

    const key = objectKey.replace(/^\/+/, '');
    const allowedPrefixes = [
      `uploads/avatars/${user.id}`,
      `uploads/banners/${user.id}`,
      `uploads/streamer-ids/${user.id}`,
    ];
    if (!allowedPrefixes.some((p) => key === p || key.startsWith(`${p}.`))) {
      throw new ForbiddenException('Invalid profile image key');
    }

    const max = 10 * 1024 * 1024;
    if (file.size > max) {
      throw new ForbiddenException('Image exceeds 10 MB limit');
    }

    const mimeType = file.mimetype?.trim() || 'image/jpeg';
    await this.storage.writeImageBuffer(key, file.buffer, mimeType);
    return {
      success: true,
      objectKey: key,
      publicUrl: this.storage.getPublicUrl(key),
    };
  }

  @Post('podcast-cover-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async podcastCoverUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body('objectKey') objectKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (this.storage.getSettings().driver !== 'local') {
      throw new ForbiddenException(
        'Multipart podcast cover upload is only available when STORAGE_DRIVER=local',
      );
    }
    if (!file?.buffer?.length || !objectKey?.trim()) {
      throw new ForbiddenException('Missing file or objectKey');
    }

    const key = objectKey.replace(/^\/+/, '');
    const showId = key.match(
      /^uploads\/podcasts\/shows\/([0-9a-f-]{36})\/cover\./i,
    )?.[1];
    if (!showId) {
      throw new ForbiddenException('Invalid podcast cover object key');
    }

    const show = await this.prisma.podcastShow.findUnique({
      where: { id: showId },
    });
    if (!show) throw new NotFoundException('Show not found');
    if (show.creatorId !== user.id) {
      throw new ForbiddenException('Not your show');
    }

    const max = 10 * 1024 * 1024;
    if (file.size > max) {
      throw new ForbiddenException('Cover image exceeds 10 MB limit');
    }

    const abs = this.storage.getLocalAbsolutePath(key);
    await writeFile(abs, file.buffer);
    return {
      success: true,
      objectKey: key,
      publicUrl: this.storage.getPublicUrl(key),
    };
  }

  @Post('movie-poster-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async moviePosterUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body('objectKey') objectKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length || !objectKey?.trim()) {
      throw new ForbiddenException('Missing file or objectKey');
    }

    const key = objectKey.replace(/^\/+/, '');
    const videoId = key.match(
      /^uploads\/movies\/([0-9a-f-]{36})\/poster\./i,
    )?.[1];
    if (!videoId) {
      throw new ForbiddenException('Invalid movie poster object key');
    }

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) throw new NotFoundException('Video not found');
    if (video.creatorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }
    if (video.type !== 'movie') {
      throw new ForbiddenException('Poster upload is only for movies');
    }

    const max = 10 * 1024 * 1024;
    if (file.size > max) {
      throw new ForbiddenException('Poster image exceeds 10 MB limit');
    }

    const mimeType = file.mimetype?.trim() || 'image/jpeg';
    await this.storage.writeImageBuffer(key, file.buffer, mimeType);
    return {
      success: true,
      objectKey: key,
      publicUrl: this.storage.getPublicUrl(key),
    };
  }

  @Post('store-product-image-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async storeProductImageUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body('objectKey') objectKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length || !objectKey?.trim()) {
      throw new ForbiddenException('Missing file or objectKey');
    }

    const key = objectKey.replace(/^\/+/, '');
    const storeId = key.match(
      /^uploads\/stores\/([0-9a-f-]{36})\/images\//i,
    )?.[1];
    if (!storeId) {
      throw new ForbiddenException('Invalid store product image key');
    }

    const store = await this.prisma.creatorStore.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.creatorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }

    const max = 10 * 1024 * 1024;
    if (file.size > max) {
      throw new ForbiddenException('Image exceeds 10 MB limit');
    }

    const mimeType = file.mimetype?.trim() || 'image/jpeg';
    await this.storage.writeImageBuffer(key, file.buffer, mimeType);
    return {
      success: true,
      objectKey: key,
      publicUrl: this.storage.getPublicUrl(key),
    };
  }

  @Post('podcast-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async podcastUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body('objectKey') objectKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (this.storage.getSettings().driver !== 'local') {
      throw new ForbiddenException(
        'Multipart podcast upload is only available when STORAGE_DRIVER=local',
      );
    }
    if (!file?.buffer?.length || !objectKey?.trim()) {
      throw new ForbiddenException('Missing file or objectKey');
    }

    const key = objectKey.replace(/^\/+/, '');
    const episodeId = key.match(
      /^uploads\/podcasts\/([0-9a-f-]{36})/i,
    )?.[1];
    if (!episodeId) {
      throw new ForbiddenException('Invalid podcast object key');
    }

    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id: episodeId },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    if (episode.creatorId !== user.id) {
      throw new ForbiddenException('Not your upload');
    }

    const max = this.storage.getSettings().maxUploadBytes;
    if (file.size > max) {
      throw new ForbiddenException('File exceeds maximum upload size');
    }

    const abs = this.storage.getLocalAbsolutePath(key);
    await writeFile(abs, file.buffer);
    return {
      success: true,
      objectKey: key,
      publicUrl: this.storage.getPublicUrl(key),
    };
  }

  @Post('stream-thumbnail-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async streamThumbnailUpload(
    @CurrentUser() user: AuthUserPayload,
    @Body('objectKey') objectKey: string,
    @Body('streamId') streamId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length || !objectKey?.trim() || !streamId?.trim()) {
      throw new ForbiddenException('Missing file, objectKey, or streamId');
    }

    const key = objectKey.replace(/^\/+/, '');
    const expected = `uploads/stream-thumbnails/${streamId}.jpg`;
    if (key !== expected) {
      throw new ForbiddenException('Invalid stream thumbnail object key');
    }

    const stream = await this.prisma.stream.findFirst({
      where: { id: streamId, creatorId: user.id },
    });
    if (!stream) throw new NotFoundException('Stream not found');

    const max = 5 * 1024 * 1024;
    if (file.size > max) {
      throw new ForbiddenException('Thumbnail exceeds 5 MB limit');
    }

    const mimeType = file.mimetype?.trim() || 'image/jpeg';
    await this.storage.writeImageBuffer(key, file.buffer, mimeType);
    const publicUrl = this.storage.getPublicUrl(key);
    await this.prisma.stream.update({
      where: { id: streamId },
      data: { thumbnailUrl: publicUrl },
    });
    return {
      success: true,
      objectKey: key,
      publicUrl,
      thumbnailUrl: publicUrl,
    };
  }

  @Post('ad-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async adUpload(
    @Body('objectKey') objectKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (this.storage.getSettings().driver !== 'local') {
      throw new ForbiddenException(
        'Multipart ad upload is only available when STORAGE_DRIVER=local',
      );
    }
    if (!file?.buffer?.length || !objectKey?.trim()) {
      throw new ForbiddenException('Missing file or objectKey');
    }

    const key = objectKey.replace(/^\/+/, '');
    if (!key.startsWith('uploads/ads/')) {
      throw new ForbiddenException('Invalid ad media object key');
    }

    const max = 50 * 1024 * 1024;
    if (file.size > max) {
      throw new ForbiddenException('Ad media exceeds 50 MB limit');
    }

    const abs = this.storage.getLocalAbsolutePath(key);
    await writeFile(abs, file.buffer);
    return {
      success: true,
      objectKey: key,
      publicUrl: this.storage.getPublicUrl(key),
    };
  }
}
