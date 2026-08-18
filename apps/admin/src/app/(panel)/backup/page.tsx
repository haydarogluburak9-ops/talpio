'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { useState } from 'react';

import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { t } from '@/lib/i18n';

export default function BackupPage() {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const query = useQuery({
    queryKey: queryKeys.admin.backupStatus(),
    queryFn: ({ signal }) => apiClient.admin.getBackupStatus(signal),
  });
  const verify = useMutation({
    mutationFn: () => apiClient.admin.verifyBackup({ note: note || undefined }),
    onSuccess: () => {
      setNote('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.backupStatus() });
    },
  });
  const data = query.data;

  return (
    <>
      <Topbar titleKey="admin.backupStatus" descriptionKey="admin.backupHint" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.backupStatus')}</CardTitle>
            <CardDescription>{t('admin.backupHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              {data?.lastVerifiedAt
                ? `${data.lastVerifiedAt}${data.lastNote ? ` — ${data.lastNote}` : ''}`
                : t('admin.backupNever')}
            </p>
            <ul className="list-disc space-y-1 pl-5 text-foreground-muted">
              {(data?.checklist ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-xs text-foreground-muted">{data?.runbook}</p>
            <label className="block text-xs text-foreground-muted">
              {t('admin.backupNote')}
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-1 w-full rounded-md border px-2 py-1"
                rows={2}
              />
            </label>
            <Button type="button" disabled={verify.isPending} onClick={() => verify.mutate()}>
              {t('admin.backupVerify')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
