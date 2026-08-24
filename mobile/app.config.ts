import type { ConfigContext, ExpoConfig } from 'expo/config';

import appJson from './app.json';

const expo = appJson.expo as ExpoConfig;

const OTA_URL = process.env.EXPO_OTA_URL ?? 'https://srv1765056.hstgr.cloud/ota';
const OTA_APP_ID = process.env.EXPO_OTA_APP_ID ?? '';
const OTA_CHANNEL = process.env.EXPO_OTA_CHANNEL ?? 'production';
const OTA_BRANCH = process.env.EXPO_OTA_BRANCH ?? 'production';
const otaEnabled = Boolean(OTA_APP_ID);

const plugins: NonNullable<ExpoConfig['plugins']> = [...(expo.plugins ?? [])];
if (otaEnabled) {
  plugins.push([
    'expo-updates',
    {
      codeSigningCertificate: './certs/certificate.pem',
    },
  ]);
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...expo,
  runtimeVersion: {
    policy: 'appVersion',
  },
  ...(otaEnabled
    ? {
        updates: {
          url: `${OTA_URL}/manifest`,
          checkAutomatically: 'ON_LOAD',
          requestHeaders: {
            'expo-channel-name': OTA_CHANNEL,
            'expo-app-id': OTA_APP_ID,
            'xprem-branch': OTA_BRANCH,
          },
        },
      }
    : {}),
  plugins,
});
