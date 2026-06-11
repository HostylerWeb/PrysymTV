import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ConfigController } from './config.controller';

@Module({
  imports: [AnalyticsModule],
  controllers: [ConfigController],
})
export class PublicConfigModule {}
