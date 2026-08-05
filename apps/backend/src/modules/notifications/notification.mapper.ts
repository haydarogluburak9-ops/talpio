import type { DeviceToken, Notification, NotificationParams } from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';

export type NotificationRow = Prisma.NotificationGetPayload<Record<string, never>>;
export type DeviceTokenRow = Prisma.DeviceTokenGetPayload<Record<string, never>>;

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    params: toParams(row.params),
    channels: row.channels,
    deepLink: row.deepLink,
    readAt: row.readAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toDeviceToken(row: DeviceTokenRow): DeviceToken {
  return {
    id: row.id,
    userId: row.userId,
    platform: row.platform,
    token: row.token,
    locale: row.locale,
    lastSeenAt: row.lastSeenAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * JSON sütunu her şeyi kabul eder; istemciye giden değerler dizge ve sayıya
 * indirgenir. Beklenmeyen bir yapı geldiğinde metin yerleştirmesi bozulmasın
 * diye alan atılır — eksik değişken, ekranda `[object Object]` görmekten iyidir.
 */
function toParams(value: Prisma.JsonValue): NotificationParams {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};

  const params: NotificationParams = {};

  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' || typeof item === 'number') params[key] = item;
  }

  return params;
}
