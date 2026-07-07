import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { validateEnv } from './config/env.validation';
import { MailModule } from './mail/mail.module';
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
import { AdvertisersModule } from './advertisers/advertisers.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { RevenueModule } from './revenue/revenue.module';
import { VerticalsModule } from './verticals/verticals.module';
import { CategoriesModule } from './categories/categories.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { PublicConfigModule } from './config/config.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StoresModule } from './stores/stores.module';
import { CastModule } from './cast/cast.module';
import { PlaybackModule } from './playback/playback.module';
import { GafModule } from './gaf/gaf.module';

@Module({
  imports: [
    NotificationsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('STORAGE_DRIVER', 'local');
        const serveRoot =
          config.get<string>('MEDIA_STATIC_SERVE_PATH') ?? '/api/v1/media/files';
        if (driver !== 'local') {
          return [
            {
              rootPath: join(tmpdir(), 'prysym-static-disabled'),
              serveRoot: '/_prysym-static-disabled',
              serveStaticOptions: { index: false, dotfiles: 'deny' as const },
            },
          ];
        }
        return [
          {
            rootPath: resolve(config.getOrThrow<string>('LOCAL_STORAGE_ROOT')),
            serveRoot: serveRoot.startsWith('/') ? serveRoot : `/${serveRoot}`,
            serveStaticOptions: { index: false, dotfiles: 'deny' as const },
          },
        ];
      },
    }),
    StorageModule,
    RevenueModule,
    QueueModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: Number(config.get<string>('THROTTLE_TTL_MS') ?? 60_000),
          limit: Number(config.get<string>('THROTTLE_LIMIT') ?? 1000),
        },
      ],
    }),
    MailModule,
    PrismaModule,
    PlatformSettingsModule,
    PublicConfigModule,
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
    AdvertisersModule,
    AnalyticsModule,
    VerticalsModule,
    CategoriesModule,
    ReportsModule,
    AdminModule,
    MediaModule,
    StoresModule,
    CastModule,
    PlaybackModule,
    GafModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
