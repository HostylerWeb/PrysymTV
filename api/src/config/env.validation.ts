import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  API_PORT: number = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_ACCESS_TTL: string = '15m';

  @IsString()
  JWT_REFRESH_TTL: string = '400d';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3001';

  @IsString()
  FRONTEND_URL: string = 'http://localhost:3001';

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsInt()
  SMTP_PORT?: number;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  API_BUILD_ID?: string;

  @IsString()
  API_PUBLIC_URL!: string;

  @IsIn(['local', 's3'])
  STORAGE_DRIVER: 'local' | 's3' = 'local';

  @IsOptional()
  @IsString()
  STORAGE_RAW_KEY_PREFIX?: string;

  @IsOptional()
  @IsString()
  STORAGE_HLS_KEY_PREFIX?: string;

  @IsOptional()
  @IsString()
  STORAGE_THUMBNAIL_KEY_PREFIX?: string;

  @IsOptional()
  @IsString()
  STORAGE_RAW_KEY_PATTERN?: string;

  @IsOptional()
  @IsInt()
  STORAGE_PRESIGN_EXPIRES_SECONDS?: number;

  @IsOptional()
  @IsInt()
  UPLOAD_MAX_BYTES?: number;

  /** Per client IP — not a shared global cap. Default 1000 req / 60s in app.module. */
  @IsOptional()
  @IsInt()
  THROTTLE_TTL_MS?: number;

  @IsOptional()
  @IsInt()
  THROTTLE_LIMIT?: number;

  @IsOptional()
  @IsString()
  UPLOAD_ALLOWED_MIME_PREFIXES?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 'local')
  @IsString()
  LOCAL_STORAGE_ROOT?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 'local')
  @IsString()
  LOCAL_STORAGE_PUBLIC_BASE_URL?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 'local')
  @IsOptional()
  @IsString()
  MEDIA_STATIC_SERVE_PATH?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 's3')
  @IsString()
  S3_ENDPOINT?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 's3')
  @IsString()
  S3_BUCKET?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 's3')
  @IsString()
  S3_ACCESS_KEY_ID?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 's3')
  @IsString()
  S3_SECRET_ACCESS_KEY?: string;

  @ValidateIf((o: EnvironmentVariables) => o.STORAGE_DRIVER === 's3')
  @IsString()
  S3_PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  S3_REGION?: string;

  @IsOptional()
  @IsIn(['skip', 'ffmpeg'])
  VIDEO_PROCESSING_MODE?: 'skip' | 'ffmpeg';

  @IsOptional()
  @IsInt()
  VIDEO_PROCESSING_MAX_RETRIES?: number;

  @IsOptional()
  @IsString()
  FFMPEG_PATH?: string;

  @IsOptional()
  @IsString()
  FFPROBE_PATH?: string;

  @IsOptional()
  @IsString()
  VIDEO_PROCESSING_TMP_DIR?: string;

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  /** The Movie Database (TMDB) — admin movie poster lookup */
  @IsOptional()
  @IsString()
  TMDB_API_KEY?: string;

  /** TMDB poster lookup: `api` (official key) or `scrape` (no key, less reliable) */
  @IsOptional()
  @IsIn(['api', 'scrape'])
  TMDB_POSTER_LOOKUP_MODE?: 'api' | 'scrape';

  @IsOptional()
  @IsString()
  RTMP_INGEST_URL?: string;

  @IsOptional()
  @IsString()
  MEDIAMTX_HLS_PUBLIC_URL?: string;

  /** Shared secret for MediaMTX ready/done webhooks (header: x-mediamtx-webhook-secret). */
  @IsOptional()
  @IsString()
  MEDIAMTX_WEBHOOK_SECRET?: string;

  /** Dev only: auto-approve streamer applications (`true` / `1`) */
  @IsOptional()
  @IsString()
  AUTO_APPROVE_STREAMER?: string;

  @IsOptional()
  @IsString()
  AUTO_APPROVE_VERTICAL_CREATOR?: string;

  /** Comma-separated Google OAuth client IDs (web, iOS, Android) */
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  /** Apple Sign In — Services ID (web) or bundle ID (native) */
  @IsOptional()
  @IsString()
  APPLE_CLIENT_ID?: string;

  /** Facebook Login — app ID (public) and secret (API only) */
  @IsOptional()
  @IsString()
  FACEBOOK_APP_ID?: string;

  @IsOptional()
  @IsString()
  FACEBOOK_APP_SECRET?: string;

  /** Web Push (VAPID) — generate with: npx web-push generate-vapid-keys */
  @IsOptional()
  @IsString()
  VAPID_PUBLIC_KEY?: string;

  @IsOptional()
  @IsString()
  VAPID_PRIVATE_KEY?: string;

  @IsOptional()
  @IsString()
  VAPID_SUBJECT?: string;

  /** Firebase Cloud Messaging (Android) — JSON service account for native push delivery */
  @IsOptional()
  @IsString()
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;

  /** Preferred in production: path readable by the API process (avoids systemd .env JSON issues) */
  @IsOptional()
  @IsString()
  FIREBASE_SERVICE_ACCOUNT_PATH?: string;
}

const WEAK_SECRET_MARKERS = [
  'change-me',
  'changeme',
  'example',
  'your-secret',
  'jwt_access_secret',
  'jwt_refresh_secret',
];

function assertStrongSecrets(validated: EnvironmentVariables) {
  if (validated.NODE_ENV !== Environment.Production) {
    return;
  }
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    const value = validated[key];
    const lower = value.toLowerCase();
    if (
      value.length < 32 ||
      WEAK_SECRET_MARKERS.some((marker) => lower.includes(marker))
    ) {
      throw new Error(
        `${key} must be a unique random secret (≥32 chars), not a placeholder, in production`,
      );
    }
  }
  if (!validated.MEDIAMTX_WEBHOOK_SECRET?.trim()) {
    throw new Error(
      'MEDIAMTX_WEBHOOK_SECRET must be set in production to secure stream webhooks',
    );
  }
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  assertStrongSecrets(validated);
  return validated;
}
