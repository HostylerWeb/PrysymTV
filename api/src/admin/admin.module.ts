import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RevenueModule } from '../revenue/revenue.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, RevenueModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
