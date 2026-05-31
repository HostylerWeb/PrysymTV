import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  MinLength,
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
