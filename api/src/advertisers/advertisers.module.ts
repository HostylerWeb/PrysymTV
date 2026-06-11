import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdvertisersController } from './advertisers.controller';
import { AdvertisersService } from './advertisers.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdvertisersController],
  providers: [AdvertisersService],
  exports: [AdvertisersService],
})
export class AdvertisersModule {}
