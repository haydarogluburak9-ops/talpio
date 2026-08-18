'use client';

import { ApiError } from '@talpio/api-client';
import { Button } from '@talpio/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { useReportContent } from './use-social';

const REASONS = [
  'social.reportReasonSpam',
  'social.reportReasonAbuse',
  'social.reportReasonSexual',
  'social.reportReasonIllegal',
  'social.reportReasonOther',
] as const;

export function ReportDialog({
  targetType,
  targetId,
  onClose,
}: {
  targetType: 'POST' | 'COMMENT' | 'PROFILE';
  targetId: string;
  onClose: () => void;
}) {
  const report = useReportContent();
  const [reasonKey, setReasonKey] = useState<(typeof REASONS)[number]>('social.reportReasonSpam');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await report.mutateAsync({ targetType, targetId, reason: t(reasonKey) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('social.reportFailed'));
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-900/50 p-4">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-soft"
      >
        <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
          {targetType === 'PROFILE' ? t('social.reportProfile') : t('social.reportTitle')}
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">{t('social.reportHint')}</p>
        <label className="mt-4 block text-sm font-medium">
          {t('social.reportReason')}
          <select
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
            value={reasonKey}
            onChange={(e) => setReasonKey(e.target.value as (typeof REASONS)[number])}
          >
            {REASONS.map((key) => (
              <option key={key} value={key}>
                {t(key)}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="mt-2 text-sm text-danger-500">{error}</p> : null}
        {report.isSuccess ? (
          <p className="mt-2 text-sm text-success-600">{t('social.reportSent')}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button type="submit" disabled={report.isPending || report.isSuccess}>
            {report.isPending ? t('social.reportSending') : t('social.reportSubmit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
