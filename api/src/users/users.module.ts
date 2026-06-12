import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [BillingModule, PlaylistsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
