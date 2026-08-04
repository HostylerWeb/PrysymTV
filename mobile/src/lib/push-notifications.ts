import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, InteractionManager, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  devicePushEndpoint,
  registerPushSubscription,
  unregisterPushSubscription,
} from '@/lib/api/push';
import { loadStoredAccessToken } from '@/lib/api/client';

const PUSH_PREF_KEY = 'prysym_push_notifications_enabled';
const PUSH_ENDPOINT_KEY = 'prysym_push_endpoint';
const PUSH_POST_LOGIN_ASKED_KEY = 'prysym_push_post_login_asked';

export type PushPermissionState = {
  enabled: boolean;
  osGranted: boolean;
  canAskAgain: boolean;
};

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  // MAX importance is required for heads-up (pop-over) banners while the screen is on.
  // DEFAULT (level 3) only puts notifications in the drawer silently — no banner.
  await Notifications.setNotificationChannelAsync('default', {
    name: 'PrysymTV',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#EF511D',
    sound: 'default',
  });
}

export async function loadPushPreference(): Promise<PushPermissionState> {
  const stored = await AsyncStorage.getItem(PUSH_PREF_KEY);
  const enabled = stored === 'true';
  const os = await getOsPermissionStatus();
  return {
    enabled: enabled && os.granted,
    osGranted: os.granted,
    canAskAgain: os.canAskAgain,
  };
}

async function getOsPermissionStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const settings = await Notifications.getPermissionsAsync();
  const granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  const canAskAgain =
    settings.canAskAgain ??
    settings.ios?.status === Notifications.IosAuthorizationStatus.NOT_DETERMINED;
  return { granted: Boolean(granted), canAskAgain: Boolean(canAskAgain) };
}

async function persistPushEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PUSH_PREF_KEY, enabled ? 'true' : 'false');
}

async function persistPushEndpoint(endpoint: string | null): Promise<void> {
  if (endpoint) await AsyncStorage.setItem(PUSH_ENDPOINT_KEY, endpoint);
  else await AsyncStorage.removeItem(PUSH_ENDPOINT_KEY);
}

async function loadPushEndpoint(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_ENDPOINT_KEY);
}

async function getDevicePushToken(): Promise<string | null> {
  await ensureAndroidChannel();

  try {
    const tokenResult = await Notifications.getDevicePushTokenAsync();
    if (!tokenResult.data) return null;
    return devicePushEndpoint(
      tokenResult.data,
      tokenResult.type === 'ios' ? 'ios' : 'android',
    );
  } catch {
    return null;
  }
}

async function registerTokenWithBackend(endpoint: string): Promise<boolean> {
  const accessToken = await loadStoredAccessToken();
  if (!accessToken) return false;

  await registerPushSubscription({
    endpoint,
    keys: { p256dh: 'device', auth: 'device' },
    expirationTime: null,
  });
  await persistPushEndpoint(endpoint);
  return true;
}

async function unregisterTokenFromBackend(): Promise<void> {
  const endpoint = await loadPushEndpoint();
  if (!endpoint) return;

  const accessToken = await loadStoredAccessToken();
  if (accessToken) {
    try {
      await unregisterPushSubscription(endpoint);
    } catch {
      /* non-blocking */
    }
  }
  await persistPushEndpoint(null);
}

function showEnableExplainer(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Enable push notifications',
      'Stay up to date when creators you follow go live, when someone likes or comments on your content, and when new uploads drop.\n\nTap OK, then allow notifications on the next system prompt.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'OK', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

function showDeniedMessage(): void {
  Alert.alert(
    'Notifications not enabled',
    Platform.OS === 'ios'
      ? 'Permission was denied. You can turn notifications on later in Settings → PrysymTV → Notifications.'
      : 'Permission was denied. You can turn notifications on later in your device app settings.',
    [
      { text: 'OK', style: 'default' },
      {
        text: 'Open settings',
        onPress: () => void Linking.openSettings(),
      },
    ],
  );
}

export async function enablePushNotifications(): Promise<boolean> {
  const proceed = await showEnableExplainer();
  if (!proceed) return false;

  const current = await Notifications.getPermissionsAsync();
  let granted =
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    granted =
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  if (!granted) {
    showDeniedMessage();
    await persistPushEnabled(false);
    return false;
  }

  const endpoint = await getDevicePushToken();
  if (!endpoint) {
    Alert.alert(
      'Push unavailable',
      'Could not register this device for push notifications. Ensure google-services.json is configured (Android) and try again on a physical device.',
    );
    await persistPushEnabled(false);
    return false;
  }

  const registered = await registerTokenWithBackend(endpoint);
  if (!registered) {
    Alert.alert('Sign in required', 'Sign in to enable push notifications on this device.');
    await persistPushEnabled(false);
    return false;
  }

  await persistPushEnabled(true);
  return true;
}

export async function disablePushNotifications(): Promise<void> {
  await unregisterTokenFromBackend();
  await persistPushEnabled(false);
}

export async function handlePushToggle(nextEnabled: boolean): Promise<boolean> {
  if (nextEnabled) {
    return enablePushNotifications();
  }
  await disablePushNotifications();
  return false;
}

/**
 * Shown once after a fresh sign-in (not on session restore). Explainer → OS prompt.
 */
export async function promptPushNotificationsAfterLogin(): Promise<void> {
  const alreadyAsked = await AsyncStorage.getItem(PUSH_POST_LOGIN_ASKED_KEY);
  if (alreadyAsked === 'true') return;

  const os = await getOsPermissionStatus();
  if (os.granted) {
    await AsyncStorage.setItem(PUSH_POST_LOGIN_ASKED_KEY, 'true');
    const endpoint = await getDevicePushToken();
    if (endpoint) await registerTokenWithBackend(endpoint);
    await persistPushEnabled(true);
    return;
  }

  await AsyncStorage.setItem(PUSH_POST_LOGIN_ASKED_KEY, 'true');
  await enablePushNotifications();
}

export function schedulePushPromptAfterLogin(): void {
  InteractionManager.runAfterInteractions(() => {
    void promptPushNotificationsAfterLogin();
  });
}

/** Re-register the device push token after login when push was already enabled. */
export async function syncPushSubscriptionAfterLogin(): Promise<void> {
  const stored = await AsyncStorage.getItem(PUSH_PREF_KEY);
  if (stored !== 'true') return;

  const os = await getOsPermissionStatus();
  if (!os.granted) return;

  const endpoint = await getDevicePushToken();
  if (!endpoint) return;

  await registerTokenWithBackend(endpoint);
}
