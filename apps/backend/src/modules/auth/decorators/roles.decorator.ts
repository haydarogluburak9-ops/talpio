import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@ustapilot/types';

export const ROLES_KEY = 'auth:roles';

/** Ucu yalnızca verilen rollere açar. Nesne bazlı kontroller servis katmanında kalır. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
