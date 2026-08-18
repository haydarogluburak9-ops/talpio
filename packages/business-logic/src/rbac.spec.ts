import { Permission, PlatformRoleCode, UserRole } from '@talpio/types';

import {
  hasEffectivePermission,
  mergeLegacyAndPlatformPermissions,
  PLATFORM_ROLE_PERMISSIONS,
} from './rbac';

describe('platform RBAC', () => {
  it('buyer izinlerini tanımlar', () => {
    expect(PLATFORM_ROLE_PERMISSIONS[PlatformRoleCode.BUYER]).toContain(Permission.REQUEST_CREATE);
  });

  it('legacy + platform izinlerini birleştirir', () => {
    const merged = mergeLegacyAndPlatformPermissions(UserRole.CUSTOMER, [PlatformRoleCode.BUYER]);
    expect(merged).toContain(Permission.JOB_CREATE);
    expect(merged).toContain(Permission.REQUEST_CREATE);
  });

  it('assignment yokken legacy map ile platform izin ekler', () => {
    const merged = mergeLegacyAndPlatformPermissions(UserRole.PROVIDER, []);
    expect(merged).toContain(Permission.SUPPLIER_PROFILE_MANAGE);
  });

  it('hasEffectivePermission kod listesini kontrol eder', () => {
    expect(hasEffectivePermission([Permission.REQUEST_CREATE], Permission.REQUEST_CREATE)).toBe(
      true,
    );
    expect(hasEffectivePermission([Permission.JOB_CREATE], Permission.REQUEST_CREATE)).toBe(false);
  });
});
