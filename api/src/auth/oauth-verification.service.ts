import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as jose from 'jose';

export type VerifiedGoogleProfile = {
  sub: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

export type VerifiedAppleProfile = {
  sub: string;
  email?: string;
  emailVerified: boolean;
};

export type VerifiedFacebookProfile = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

@Injectable()
export class OAuthVerificationService {
  private readonly googleClient = new OAuth2Client();
  private readonly appleJwks = jose.createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys'),
  );

  constructor(private config: ConfigService) {}

  private googleClientIds(): string[] {
    const raw = this.config.get<string>('GOOGLE_CLIENT_ID', '');
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  private appleClientIds(): string[] {
    const raw = this.config.get<string>('APPLE_CLIENT_ID', '');
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  async verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleProfile> {
    const audiences = this.googleClientIds();
    if (!audiences.length) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: audiences,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new BadRequestException('Invalid Google token');
    }

    return {
      sub: payload.sub,
      email: payload.email?.toLowerCase(),
      emailVerified: payload.email_verified === true,
      name: payload.name,
      picture: payload.picture,
    };
  }

  async verifyAppleIdentityToken(
    identityToken: string,
  ): Promise<VerifiedAppleProfile> {
    const audiences = this.appleClientIds();
    if (!audiences.length) {
      throw new ServiceUnavailableException('Apple sign-in is not configured');
    }

    const { payload } = await jose.jwtVerify(identityToken, this.appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });

    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new BadRequestException('Invalid Apple token');
    }

    const email =
      typeof payload.email === 'string'
        ? payload.email.toLowerCase()
        : undefined;

    return {
      sub: payload.sub,
      email,
      emailVerified:
        payload.email_verified === true || payload.email_verified === 'true',
    };
  }

  private facebookAppId(): string | null {
    const raw = this.config.get<string>('FACEBOOK_APP_ID', '').trim();
    return raw || null;
  }

  private facebookAppSecret(): string | null {
    const raw = this.config.get<string>('FACEBOOK_APP_SECRET', '').trim();
    return raw || null;
  }

  async verifyFacebookAccessToken(
    accessToken: string,
  ): Promise<VerifiedFacebookProfile> {
    const appId = this.facebookAppId();
    const appSecret = this.facebookAppSecret();
    if (!appId || !appSecret) {
      throw new ServiceUnavailableException(
        'Facebook sign-in is not configured',
      );
    }

    const appAccessToken = `${appId}|${appSecret}`;
    const debugUrl = new URL('https://graph.facebook.com/debug_token');
    debugUrl.searchParams.set('input_token', accessToken);
    debugUrl.searchParams.set('access_token', appAccessToken);

    const debugRes = await fetch(debugUrl);
    if (!debugRes.ok) {
      throw new BadRequestException('Invalid Facebook token');
    }

    const debugPayload = (await debugRes.json()) as {
      data?: {
        is_valid?: boolean;
        app_id?: string;
        user_id?: string;
      };
    };
    const debugData = debugPayload.data;
    if (
      !debugData?.is_valid ||
      debugData.app_id !== appId ||
      !debugData.user_id
    ) {
      throw new BadRequestException('Invalid Facebook token');
    }

    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set(
      'fields',
      'id,name,email,picture.type(large)',
    );
    profileUrl.searchParams.set('access_token', accessToken);

    const profileRes = await fetch(profileUrl);
    if (!profileRes.ok) {
      throw new BadRequestException('Could not load Facebook profile');
    }

    const profile = (await profileRes.json()) as {
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };

    if (!profile.id || profile.id !== debugData.user_id) {
      throw new BadRequestException('Invalid Facebook profile');
    }

    return {
      sub: profile.id,
      email: profile.email?.toLowerCase(),
      name: profile.name,
      picture: profile.picture?.data?.url,
    };
  }
}
