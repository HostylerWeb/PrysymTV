export const MOCK_GOOGLE_TOKEN = 'ui-preview-google-token';
export const MOCK_APPLE_TOKEN = 'ui-preview-apple-token';
export const MOCK_FACEBOOK_TOKEN = 'ui-preview-facebook-token';

export function isPreviewOAuthToken(token: string): boolean {
  return token.startsWith('ui-preview-');
}

export function isPlaceholderGoogleClientId(id: string | null | undefined): boolean {
  if (!id?.trim()) return true;
  const value = id.trim().toLowerCase();
  return (
    value.includes('your-web-client-id') ||
    value.includes('web-id.apps') ||
    value.includes('example')
  );
}

export function isPlaceholderAppleClientId(id: string | null | undefined): boolean {
  if (!id?.trim()) return true;
  return id.trim() === 'com.prysym.web';
}

export function isPlaceholderFacebookAppId(id: string | null | undefined): boolean {
  if (!id?.trim()) return true;
  const value = id.trim().toLowerCase();
  return (
    value.includes('your-facebook-app-id') ||
    value.includes('example') ||
    value === '1234567890'
  );
}

export function shouldUseMockOAuthSignIn(options: {
  preferMock?: boolean;
  googleWebClientId?: string | null;
  googleIosClientId?: string | null;
  googleAndroidClientId?: string | null;
  appleClientId?: string | null;
  facebookAppId?: string | null;
}): boolean {
  if (options.preferMock) return true;

  const googleIds = [
    options.googleWebClientId,
    options.googleIosClientId,
    options.googleAndroidClientId,
  ].filter((id): id is string => Boolean(id?.trim()));

  const googleIsPlaceholder =
    googleIds.length === 0 ||
    googleIds.every((id) => isPlaceholderGoogleClientId(id));
  const appleIsPlaceholder = isPlaceholderAppleClientId(options.appleClientId);
  const facebookIsPlaceholder = isPlaceholderFacebookAppId(options.facebookAppId);

  return googleIsPlaceholder && appleIsPlaceholder && facebookIsPlaceholder;
}
