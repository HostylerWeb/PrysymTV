import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
