import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@talpio/types';

export const PERMISSIONS_KEY = 'auth:permissions';

/** Ucu verilen izinlerden en az birine sahip kullanıcıya açar. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
