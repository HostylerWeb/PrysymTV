import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, InteractionManager, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const PUSH_PREF_KEY = 'prysym_push_notifications_enabled';
const PUSH_POST_LOGIN_ASKED_KEY = 'prysym_push_post_login_asked';

export type PushPermissionState = {
  enabled: boolean;
  osGranted: boolean;
  canAskAgain: boolean;
};

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

/**
 * Mock push flow for UI: explainer alert → OS permission prompt → local preference.
 * Real FCM/APNs token registration comes in a later backend phase.
 */
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

  await persistPushEnabled(true);
  return true;
}

export async function disablePushNotifications(): Promise<void> {
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
