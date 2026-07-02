import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { StoresModule } from '../stores/stores.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [BillingModule, PlaylistsModule, StoresModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
