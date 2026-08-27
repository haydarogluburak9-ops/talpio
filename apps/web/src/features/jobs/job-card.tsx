'use client';

import { JOB_STATUS_TONES } from '@talpio/config';
import { formatMoney, formatRelativeTime, jobStatusLabel } from '@talpio/localization';
import type { JobRequest } from '@talpio/types';
import { Badge, Card, CardContent, StatusPill } from '@talpio/ui';
import Link from 'next/link';

import { t, categoryName, getLocale } from '@/lib/i18n';

export function JobCard({ job }: { job: JobRequest }) {
  const locale = getLocale();

  return (
    <Link href={`/taleplerim/${job.id}`} className="block rounded-[--radius-card]">
      <Card className="transition-colors hover:bg-surface-muted">
        <CardContent className="flex flex-col gap-3 pt-5 sm:pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{job.title}</p>
              <p className="text-sm text-foreground-muted">
                {categoryName(job.category)} · {job.address.districtName}, {job.address.cityName}
              </p>
            </div>
            <StatusPill label={jobStatusLabel(job.status, locale)} tone={JOB_STATUS_TONES[job.status]} />
          </div>

          <p className="line-clamp-2 text-sm text-foreground-muted">{job.description}</p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            {job.isUrgent ? <Badge tone="danger">{t('job.urgent')}</Badge> : null}
            {job.budget ? <Badge tone="neutral">{formatMoney(job.budget, locale)}</Badge> : null}
            <Badge tone={job.offerCount > 0 ? 'brand' : 'neutral'}>
              {job.offerCount > 0
                ? t('job.offerCount', { count: job.offerCount })
                : t('job.noOffers')}
            </Badge>
            <span className="ml-auto">{formatRelativeTime(job.createdAt, locale)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
