import { Global, Module } from '@nestjs/common';
import { RevenueSplitService } from './revenue-split.service';

@Global()
@Module({
  providers: [RevenueSplitService],
  exports: [RevenueSplitService],
})
export class RevenueModule {}
