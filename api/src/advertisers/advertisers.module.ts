import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { StorageModule } from '../storage/storage.module';
import { AdvertisersController } from './advertisers.controller';
import { AdvertisersService } from './advertisers.service';

@Module({
  imports: [PrismaModule, PlatformSettingsModule, StorageModule],
  controllers: [AdvertisersController],
  providers: [AdvertisersService],
  exports: [AdvertisersService],
})
export class AdvertisersModule {}
