'use client';

import type { Permission, UserRole } from '@ustapilot/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSION_LABELS, ROLE_LABELS } from '@/lib/labels';

import { useAdminRoles } from './use-admin';

export function RolesPanel() {
  const roles = useAdminRoles();

  if (roles.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yetki matrisi</CardTitle>
          <CardDescription>Rol ve izin eşlemesi yükleniyor…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (roles.isError || !roles.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yetki matrisi</CardTitle>
          <CardDescription>İzin matrisi alınamadı.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => void roles.refetch()}>
            Tekrar dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  const matrix = roles.data;
  const permissionByRole = new Map(
    matrix.roles.map((entry) => [entry.role, new Set(entry.permissions)] as const),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yetki matrisi</CardTitle>
        <CardDescription>
          Kaynak: kod içi izin tablosu. Bu görünüm salt okunur; değişiklik sunucu
          tarafında yapılır.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="sticky left-0 bg-surface px-3 py-2 font-medium">İzin</th>
              {matrix.roles.map((entry) => (
                <th key={entry.role} className="px-3 py-2 text-center font-medium">
                  {ROLE_LABELS[entry.role as UserRole]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.allPermissions.map((permission) => (
              <tr key={permission} className="border-b border-border/70">
                <td className="sticky left-0 bg-surface px-3 py-2">
                  <p className="font-medium">{PERMISSION_LABELS[permission as Permission]}</p>
                  <p className="font-mono text-xs text-foreground-muted">{permission}</p>
                </td>
                {matrix.roles.map((entry) => {
                  const allowed = permissionByRole.get(entry.role)?.has(permission) ?? false;
                  return (
                    <td
                      key={`${entry.role}-${permission}`}
                      className="px-3 py-2 text-center tabular-nums"
                      aria-label={allowed ? 'Var' : 'Yok'}
                    >
                      {allowed ? (
                        <span className="font-medium text-brand-700 dark:text-brand-100">✓</span>
                      ) : (
                        <span className="text-foreground-muted">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
