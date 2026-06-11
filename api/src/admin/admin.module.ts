import { Module } from '@nestjs/common';
import { AdvertisersModule } from '../advertisers/advertisers.module';
import { GafModule } from '../gaf/gaf.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RevenueModule } from '../revenue/revenue.module';
import { StorageModule } from '../storage/storage.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [
    PrismaModule,
    RevenueModule,
    AdvertisersModule,
    GafModule,
    StorageModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditLogService],
})
export class AdminModule {}
