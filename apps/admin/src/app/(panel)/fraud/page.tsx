'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { useState } from 'react';

import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { t } from '@/lib/i18n';

export default function FraudPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const query = useQuery({
    queryKey: queryKeys.admin.fraudFlags({ status }),
    queryFn: ({ signal }) => apiClient.admin.listFraudFlags(status ? { status } : {}, signal),
  });
  const update = useMutation({
    mutationFn: (input: { id: string; status: string }) => apiClient.admin.updateFraudFlag(input.id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.fraudFlags() });
    },
  });
  const rows =
    (query.data as Array<{
      id: string;
      reason?: string;
      status?: string;
      userId?: string;
      note?: string;
    }> | undefined) ?? [];

  return (
    <>
      <Topbar titleKey="admin.fraudFlags" descriptionKey="admin.fraudHint" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.fraudFlags')}</CardTitle>
            <CardDescription>{t('admin.fraudHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <label className="block text-xs">
              {t('admin.statusFilter')}
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-1 w-full rounded-md border px-2 py-1"
              >
                <option value="">{t('common.filter')}</option>
                <option value="OPEN">OPEN</option>
                <option value="REVIEWING">REVIEWING</option>
                <option value="DISMISSED">DISMISSED</option>
                <option value="CONFIRMED">CONFIRMED</option>
              </select>
            </label>
            {rows.map((row) => (
              <div key={row.id} className="rounded-md border border-border p-3">
                <p>
                  {row.reason ?? '—'} — {row.status ?? 'OPEN'} · {row.userId ?? '—'}
                </p>
                {row.note ? <p className="text-xs text-foreground-muted">{row.note}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: row.id, status: 'REVIEWING' })}
                  >
                    {t('admin.actionReview')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: row.id, status: 'DISMISSED' })}
                  >
                    {t('admin.actionDismiss')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: row.id, status: 'CONFIRMED' })}
                  >
                    {t('admin.metricVerified')}
                  </Button>
                </div>
              </div>
            ))}
            {query.isSuccess && rows.length === 0 ? (
              <p className="text-foreground-muted">{t('admin.reportEmpty')}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
