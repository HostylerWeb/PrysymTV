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
  JWT_REFRESH_TTL: string = '7d';

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
  VIDEO_PROCESSING_TMP_DIR?: string;
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
