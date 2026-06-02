import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StreamsController } from './streams.controller';
import { StreamsGateway } from './streams.gateway';
import { StreamsService } from './streams.service';

@Module({
  imports: [AuthModule],
  controllers: [StreamsController],
  providers: [StreamsService, StreamsGateway],
  exports: [StreamsService],
})
export class StreamsModule {}
