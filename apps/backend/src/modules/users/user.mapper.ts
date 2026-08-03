import { permissionsForRole } from '@ustapilot/business-logic';
import type { CurrentUser } from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';

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
