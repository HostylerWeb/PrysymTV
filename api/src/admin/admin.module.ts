import { Module } from '@nestjs/common';
import { AdvertisersModule } from '../advertisers/advertisers.module';
import { GafModule } from '../gaf/gaf.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RevenueModule } from '../revenue/revenue.module';
import { StorageModule } from '../storage/storage.module';
import { TmdbModule } from '../tmdb/tmdb.module';
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
    PlaylistsModule,
    TmdbModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditLogService],
})
export class AdminModule {}
