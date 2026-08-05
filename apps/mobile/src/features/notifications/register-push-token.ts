import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { DevicePlatform } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

/**
 * Push jetonu kaydı.
 *
 * İzin reddedilirse veya simülatörde çalışıyorsa sessizce çıkar; çağıranın
 * akışını bozmaz. Başarısız API çağrıları da yutulur.
 */
export async function registerPushToken(locale?: string): Promise<void> {
  try {
    if (!Device.isDevice) return;

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;

    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;

    const expoToken = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const platform =
      Platform.OS === 'ios'
        ? DevicePlatform.IOS
        : Platform.OS === 'android'
          ? DevicePlatform.ANDROID
          : DevicePlatform.WEB;

    await apiClient.notifications.registerDeviceToken({
      token: expoToken.data,
      platform,
      ...(locale ? { locale } : {}),
    });
  } catch {
    // Push kayıt ana akışı etkilemez.
  }
}
