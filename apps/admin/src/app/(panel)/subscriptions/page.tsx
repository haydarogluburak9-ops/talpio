'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

export default function SubscriptionsPage() {
  const query = useQuery({
    queryKey: queryKeys.admin.subscriptions(),
    queryFn: ({ signal }) => apiClient.admin.listSubscriptions(signal),
  });

  const data = query.data as {
    plans?: Array<{ code: string; name: string; monthlyCredits: number }>;
    subscriptions?: Array<{
      id: string;
      status: string;
      plan?: { name?: string; code?: string };
      currentPeriodEnd?: string;
    }>;
    wallets?: Array<{ id: string; balanceCredits: number; userId?: string | null }>;
  } | undefined;

  return (
    <>
      <Topbar titleKey="admin.subscriptions" descriptionKey="admin.subscriptionsHint" />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planlar</CardTitle>
            <CardDescription>GET /admin/subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {(data?.plans ?? []).map((plan) => (
              <p key={plan.code}>
                {plan.name} — {plan.monthlyCredits} kredi/ay
              </p>
            ))}
            {query.isSuccess && (data?.plans?.length ?? 0) === 0 ? (
              <p className="text-foreground-muted">Plan kaydı yok.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Abonelikler</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(data?.subscriptions ?? []).map((row) => (
              <p key={row.id}>
                {row.plan?.name ?? row.plan?.code} — {row.status}
              </p>
            ))}
            {query.isSuccess && (data?.subscriptions?.length ?? 0) === 0 ? (
              <p className="text-foreground-muted">Abonelik kaydı yok.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI kredi cüzdanları</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(data?.wallets ?? []).map((row) => (
              <p key={row.id}>
                {row.userId ?? '—'} — {row.balanceCredits} kredi
              </p>
            ))}
            {query.isSuccess && (data?.wallets?.length ?? 0) === 0 ? (
              <p className="text-foreground-muted">Cüzdan kaydı yok.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
