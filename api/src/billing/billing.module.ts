import { Module } from '@nestjs/common';
import { RevenueModule } from '../revenue/revenue.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [RevenueModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
