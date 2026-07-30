import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TvAuthService } from './tv-auth.service';
import { OAuthVerificationService } from './oauth-verification.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, TvAuthService, OAuthVerificationService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
