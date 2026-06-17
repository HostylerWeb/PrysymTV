import { Module } from '@nestjs/common';
import { RevenueModule } from '../revenue/revenue.module';
import { StreamsModule } from '../streams/streams.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreatorsBalanceService } from './creators-balance.service';

@Module({
  imports: [RevenueModule, StreamsModule],
  controllers: [BillingController],
  providers: [BillingService, CreatorsBalanceService],
  exports: [BillingService, CreatorsBalanceService],
})
export class BillingModule {}
