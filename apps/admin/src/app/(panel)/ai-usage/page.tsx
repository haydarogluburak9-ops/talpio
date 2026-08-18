'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

export default function AiUsagePage() {
  const query = useQuery({
    queryKey: queryKeys.admin.aiUsage(),
    queryFn: ({ signal }) => apiClient.admin.listAiUsage(signal),
  });
  const rows =
    (query.data as Array<{
      id: string;
      featureCode: string;
      provider?: string | null;
      creditsCharged?: number;
      success: boolean;
    }> | undefined) ?? [];

  return (
    <>
      <Topbar titleKey="admin.aiUsage" descriptionKey="admin.aiUsageHint" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Kayıtlar</CardTitle>
            <CardDescription>GET /admin/ai-usage</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {rows.map((row) => (
              <p key={row.id}>
                {row.featureCode} — {row.provider ?? '—'} · {row.creditsCharged ?? 0} kredi ·{' '}
                {row.success ? 'ok' : 'hata'}
              </p>
            ))}
            {query.isSuccess && rows.length === 0 ? (
              <p className="text-foreground-muted">AI kullanım kaydı yok.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
