import { Module, forwardRef } from '@nestjs/common';
import { RevenueModule } from '../revenue/revenue.module';
import { StoresModule } from '../stores/stores.module';
import { StreamsModule } from '../streams/streams.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreatorsBalanceService } from './creators-balance.service';

@Module({
  imports: [RevenueModule, StreamsModule, forwardRef(() => StoresModule)],
  controllers: [BillingController],
  providers: [BillingService, CreatorsBalanceService],
  exports: [BillingService, CreatorsBalanceService],
})
export class BillingModule {}
