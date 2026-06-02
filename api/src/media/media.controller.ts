import {
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

    const objectKey = this.storage.buildRawKey(videoId, file.originalname);
    await this.storage.writeLocalRaw(videoId, objectKey, file.buffer);
    return { success: true, objectKey, bytes: file.size };
  }
}
