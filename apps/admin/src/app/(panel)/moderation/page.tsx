'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { ContentReportStatus, ModerationAction, type ContentReport } from '@talpio/types';
import { useState } from 'react';

import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { t } from '@/lib/i18n';

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const query = useQuery({
    queryKey: queryKeys.admin.moderation({ status, q }),
    queryFn: ({ signal }) =>
      apiClient.admin.listModerationReports(
        { ...(status ? { status } : {}), ...(q ? { q } : {}) },
        signal,
      ),
  });
  const rows = query.data ?? [];

  const update = useMutation({
    mutationFn: (input: { id: string; status: string; action?: string; actionNote?: string }) =>
      apiClient.admin.updateModerationReport(input.id, {
        status: input.status,
        action: input.action,
        actionNote: input.actionNote,
      }),
    onSuccess: () => {
      setNote('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.moderation() });
    },
  });

  return (
    <>
      <Topbar titleKey="admin.socialModeration" descriptionKey="admin.moderationHint" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.reportsTitle')}</CardTitle>
            <CardDescription>{t('admin.moderationHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs text-foreground-muted">
                {t('admin.statusFilter')}
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-1 w-full rounded-md border px-2 py-1"
                >
                  <option value="">{t('common.filter')}</option>
                  <option value="OPEN">OPEN</option>
                  <option value="REVIEWING">REVIEWING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>
              <label className="block text-xs text-foreground-muted">
                {t('admin.searchReports')}
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  className="mt-1 w-full rounded-md border px-2 py-1"
                />
              </label>
            </div>
            {selected.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                disabled={update.isPending}
                onClick={() =>
                  void apiClient.admin
                    .bulkUpdateModerationReports({
                      ids: selected,
                      status: ContentReportStatus.REJECTED,
                      actionNote: note || undefined,
                    })
                    .then(() => {
                      setSelected([]);
                      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.moderation() });
                    })
                }
              >
                {t('admin.bulkDismiss')} ({selected.length})
              </Button>
            ) : null}
            <label className="block text-xs text-foreground-muted">
              {t('admin.actionNote')}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('admin.actionNotePlaceholder')}
                className="mt-1 w-full rounded-md border px-2 py-1"
                rows={2}
              />
            </label>
            {rows.map((row) => (
              <div key={row.id} className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id),
                      )
                    }
                  />
                  {row.id.slice(0, 8)}
                </label>
                <ReportRow
                  row={row}
                  note={note}
                  pending={update.isPending}
                  onAct={(nextStatus, action) =>
                    update.mutate({
                      id: row.id,
                      status: nextStatus,
                      action,
                      actionNote: note || undefined,
                    })
                  }
                />
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

function ReportRow({
  row,
  pending,
  onAct,
}: {
  row: ContentReport;
  note: string;
  pending: boolean;
  onAct: (status: string, action?: string) => void;
}) {
  const target = row.target;
  const open = row.status === ContentReportStatus.OPEN || row.status === ContentReportStatus.REVIEWING;

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <p className="font-medium">
        {row.targetType} · {row.status}
        {target?.removed ? ` · ${t('admin.reportRemoved')}` : ''}
      </p>
      <p>
        <span className="text-foreground-muted">{t('admin.reportReasonLabel')}: </span>
        {row.reason}
      </p>
      <p>
        <span className="text-foreground-muted">{t('admin.reportPreview')}: </span>
        {target?.preview}
      </p>
      {target?.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={target.mediaUrl} alt="" className="max-h-40 rounded-md object-cover" />
      ) : null}
      <p className="text-foreground-muted">
        {t('admin.reportAuthor')}: {target?.authorName ?? '—'}
        {target?.authorUsername ? ` (@${target.authorUsername})` : ''}
        {' · '}
        {t('admin.reportReporter')}: {row.reporterName ?? row.reporterUserId.slice(0, 8)}
      </p>
      {open ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onAct(ContentReportStatus.REVIEWING, ModerationAction.NONE)}
          >
            {t('admin.actionReview')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onAct(ContentReportStatus.REJECTED, ModerationAction.NONE)}
          >
            {t('admin.actionDismiss')}
          </Button>
          {row.targetType !== 'PROFILE' ? (
            <Button
              size="sm"
              disabled={pending || Boolean(target?.removed)}
              onClick={() => onAct(ContentReportStatus.RESOLVED, ModerationAction.REMOVE_CONTENT)}
            >
              {t('admin.actionRemove')}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !target?.authorUserId}
            onClick={() => onAct(ContentReportStatus.RESOLVED, ModerationAction.SUSPEND_AUTHOR)}
          >
            {t('admin.actionSuspend')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !target?.authorUserId}
            onClick={() => onAct(ContentReportStatus.RESOLVED, ModerationAction.BAN_AUTHOR)}
          >
            {t('admin.actionBan')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
