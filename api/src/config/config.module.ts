import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigController } from './config.controller';

@Module({
  imports: [AnalyticsModule, NotificationsModule],
  controllers: [ConfigController],
})
export class PublicConfigModule {}
