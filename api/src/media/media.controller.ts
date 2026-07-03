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
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { writeFile } from 'fs/promises';

/** Local storage only: multipart upload of raw file bytes. */
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
      storage: memoryStorage(),
    }),
  )
  async uploadRaw(
    @Param('videoId') videoId: string,
    @CurrentUser() user: AuthUserPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (this.storage.getSettings().driver !== 'local') {
      throw new ForbiddenException(
        'Multipart media upload is only available when STORAGE_DRIVER=local',
      );
    }
    if (!file?.buffer?.length) {
      throw new ForbiddenException('Missing file');
    }

    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');
    if (video.creatorId !== user.id) {
      throw new ForbiddenException('Not your upload');
    }

    const max = this.storage.getSettings().maxUploadBytes;
    if (file.size > max) {
      throw new ForbiddenException('File exceeds maximum upload size');
    }

    const objectKey =
      video.rawObjectKey ?? this.storage.buildRawKey(videoId, file.originalname);
    await this.storage.writeLocalRaw(videoId, objectKey, file.buffer);
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
