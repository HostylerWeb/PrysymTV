import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RevenueModule } from '../revenue/revenue.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [PrismaModule, BillingModule, RevenueModule, PlatformSettingsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
