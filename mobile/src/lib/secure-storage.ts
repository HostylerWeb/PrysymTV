import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const useSecureStore = Platform.OS !== 'web';

async function getItem(key: string): Promise<string | null> {
  if (useSecureStore) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  }
  return AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      await AsyncStorage.setItem(key, value);
      return;
    }
  }
  await AsyncStorage.setItem(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (useSecureStore) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  }
  await AsyncStorage.removeItem(key);
}

/** Migrate legacy AsyncStorage tokens into secure storage once. */
export async function migrateLegacyTokens(
  accessKey: string,
  refreshKey: string,
): Promise<void> {
  const [secureAccess, secureRefresh] = await Promise.all([
    getItem(accessKey),
    getItem(refreshKey),
  ]);
  if (secureAccess && secureRefresh) return;

  const [legacyAccess, legacyRefresh] = await Promise.all([
    AsyncStorage.getItem(accessKey),
    AsyncStorage.getItem(refreshKey),
  ]);

  if (!secureAccess && legacyAccess) {
    await setItem(accessKey, legacyAccess);
    await AsyncStorage.removeItem(accessKey);
  }
  if (!secureRefresh && legacyRefresh) {
    await setItem(refreshKey, legacyRefresh);
    await AsyncStorage.removeItem(refreshKey);
  }
}

export const secureStorage = {
  getItem,
  setItem,
  deleteItem,
};
