'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

export default function PromotionsPage() {
  const query = useQuery({
    queryKey: queryKeys.admin.campaigns(),
    queryFn: ({ signal }) => apiClient.admin.listCampaigns(signal),
  });
  const rows = (query.data as Array<{
    id: string;
    title: string;
    status: string;
    audience: string;
    business?: { name?: string };
  }> | undefined) ?? [];

  return (
    <>
      <Topbar titleKey="admin.campaigns" descriptionKey="admin.campaignsHint" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Kampanya listesi</CardTitle>
            <CardDescription>GET /admin/campaigns</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {rows.map((row) => (
              <p key={row.id}>
                {row.title} — {row.business?.name ?? 'İşletme'} ({row.status} / {row.audience})
              </p>
            ))}
            {query.isSuccess && rows.length === 0 ? (
              <p className="text-foreground-muted">Kampanya kaydı yok.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
