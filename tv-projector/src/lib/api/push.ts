import { Platform } from 'react-native';
import { apiRequest } from './client';

export type PushSubscriptionStatus = {
  subscribed: boolean;
  enabled: boolean;
};

export function fetchPushSubscriptionStatus() {
  return apiRequest<PushSubscriptionStatus>('/users/me/push-subscription');
}

export function registerPushSubscription(body: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}) {
  return apiRequest<{ id: string }>('/users/me/push-subscription', {
    method: 'POST',
    body,
  });
}

export function unregisterPushSubscription(endpoint: string) {
  return apiRequest<{ success: boolean }>('/users/me/push-subscription', {
    method: 'DELETE',
    body: { endpoint },
  });
}

/** Native device push tokens (FCM on Android, APNs on iOS) — no Expo account required. */
export const FCM_PUSH_ENDPOINT_PREFIX = 'fcm:';
export const APNS_PUSH_ENDPOINT_PREFIX = 'apns:';

export function devicePushEndpoint(token: string, platform: 'android' | 'ios' = Platform.OS as 'android' | 'ios') {
  const prefix = platform === 'ios' ? APNS_PUSH_ENDPOINT_PREFIX : FCM_PUSH_ENDPOINT_PREFIX;
  return `${prefix}${token}`;
}
