'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { t } from '@/lib/i18n';

export default function CommerceRequestsPage() {
  const query = useQuery({
    queryKey: queryKeys.admin.commerceRequests(),
    queryFn: ({ signal }) => apiClient.admin.listCommerceRequests(signal),
  });
  const rows =
    (query.data as Array<{
      id: string;
      title: string;
      status: string;
      _count?: { offers?: number; matches?: number };
    }> | undefined) ?? [];

  return (
    <>
      <Topbar titleKey="admin.commerceRequests" descriptionKey="admin.commerceRequestsHint" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.commerceRequests')}</CardTitle>
            <CardDescription>{t('admin.commerceRequestsHint')}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {rows.map((row) => (
              <p key={row.id}>
                {row.title} — {row.status} · {row._count?.offers ?? 0} teklif ·{' '}
                {row._count?.matches ?? 0} eşleşme
              </p>
            ))}
            {query.isSuccess && rows.length === 0 ? (
              <p className="text-foreground-muted">Ticaret talebi yok.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
