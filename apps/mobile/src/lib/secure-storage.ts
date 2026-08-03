import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { SecureStorageAdapter } from '@ustapilot/api-client';

/**
 * Expo SecureStore, iOS'ta Keychain ve Android'de EncryptedSharedPreferences
 * kullanır. Web hedefinde (Expo web) SecureStore yoktur; orada jetonlar zaten
 * HTTP-only çerezle taşınacağı için bellek yedeği yeterlidir.
 */
const memoryFallback = new Map<string, string>();

export const secureStorage: SecureStorageAdapter = {
  async getItem(key) {
    if (Platform.OS === 'web') return memoryFallback.get(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      memoryFallback.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      memoryFallback.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
