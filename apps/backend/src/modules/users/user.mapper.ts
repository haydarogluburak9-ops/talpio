import { permissionsForRole } from '@talpio/business-logic';
import {
  COUNTRY_CURRENCY,
  DEFAULT_CURRENCY,
  LOCALE_CURRENCY,
  isKnownCurrency,
} from '@talpio/config';
import type { CurrentUser } from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';

/** `Char(3)` alanı sağa boşlukla dolabilir; kırpılmadan katalogda bulunmaz. */
function normalizeCurrency(value: string | null): string | undefined {
  const code = value?.trim().toUpperCase();
  return code && isKnownCurrency(code) ? code : undefined;
}

/**
 * Kullanıcı sorgularında daima çekilen ilişkiler.
 *
 * Kimlik doğrulama ve profil uçları aynı gövdeyi döner; bu yüzden içerik tek
 * yerde tanımlanır ve iki modül aynı şekli üretmek için birbirini tekrar etmez.
 */
export const userInclude = {
  customerProfile: { select: { id: true } },
  providerProfile: { select: { id: true } },
  avatar: { select: { storageKey: true } },
} satisfies Prisma.UserInclude;

export type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export function toCurrentUser(user: UserRow, fileBaseUrl: string): CurrentUser {
  const role = user.role;

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    avatarUrl: user.avatar ? `${fileBaseUrl}/${user.avatar.storageKey}` : null,
    role,
    status: user.status,
    locale: user.locale,
    // Açık tercih yoksa ülke, sonra dil üzerinden türetilir; istemci "hangi
    // para biriminde gösterelim" sorusunu tekrar sormak zorunda kalmasın.
    currency:
      normalizeCurrency(user.currency) ??
      (user.countryCode ? COUNTRY_CURRENCY[user.countryCode.toUpperCase()] : undefined) ??
      LOCALE_CURRENCY[user.locale.toLowerCase().split('-')[0] ?? ''] ??
      DEFAULT_CURRENCY,
    currencyIsExplicit: normalizeCurrency(user.currency) != null,
    countryCode: user.countryCode ?? null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    permissions: [...permissionsForRole(role)],
    customerProfileId: user.customerProfile?.id ?? null,
    providerProfileId: user.providerProfile?.id ?? null,
  };
}
