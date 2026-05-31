import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { FeedModule } from './feed/feed.module';
import { VideosModule } from './videos/videos.module';
import { HistoryModule } from './history/history.module';
import { BillingModule } from './billing/billing.module';
import { StreamsModule } from './streams/streams.module';
import { PodcastsModule } from './podcasts/podcasts.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { SearchModule } from './search/search.module';
import { AdsModule } from './ads/ads.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    FeedModule,
    VideosModule,
    HistoryModule,
    BillingModule,
    StreamsModule,
    PodcastsModule,
    PlaylistsModule,
    SearchModule,
    AdsModule,
    AnalyticsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
