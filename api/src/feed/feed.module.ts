import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StreamsModule } from '../streams/streams.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [AuthModule, StreamsModule],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
