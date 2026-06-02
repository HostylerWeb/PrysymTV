import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { getStorageSettings } from '../config/storage-env';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    const storage = getStorageSettings(this.config);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      build: this.config.get<string>('API_BUILD_ID') ?? 'unknown',
      smtp: this.mail.isConfigured() ? 'ready' : 'not_ready',
      storage: storage.driver,
      videoProcessing: this.config.get<string>('VIDEO_PROCESSING_MODE') ?? 'skip',
    };
  }
}
