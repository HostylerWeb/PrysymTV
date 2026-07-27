import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VideosModule } from '../videos/videos.module';
import { VerticalsController } from './verticals.controller';
import { VerticalsService } from './verticals.service';

@Module({
  imports: [PrismaModule, VideosModule],
  controllers: [VerticalsController],
  providers: [VerticalsService],
  exports: [VerticalsService],
})
export class VerticalsModule {}
