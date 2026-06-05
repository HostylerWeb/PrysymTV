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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
    if (this.storage.getSettings().driver !== 'local') {
      throw new ForbiddenException(
        'Multipart profile upload is only available when STORAGE_DRIVER=local',
      );
    }
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

    const abs = this.storage.getLocalAbsolutePath(key);
    await writeFile(abs, file.buffer);
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
}
