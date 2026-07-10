import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlaybackModule } from '../playback/playback.module';
import { StorageModule } from '../storage/storage.module';
import { StreamsController } from './streams.controller';
import { StreamsGateway } from './streams.gateway';
import { StreamsService } from './streams.service';

@Module({
  imports: [AuthModule, StorageModule, PlaybackModule],
  controllers: [StreamsController],
  providers: [StreamsService, StreamsGateway],
  exports: [StreamsService, StreamsGateway],
})
export class StreamsModule {}
