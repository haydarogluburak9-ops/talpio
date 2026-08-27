'use client';

import { JobRequestStatus } from '@talpio/types';
import { buttonVariants, EmptyState, ErrorState, ListSkeleton } from '@talpio/ui';
import Link from 'next/link';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { JobCard } from './job-card';
import { useMyJobs } from './use-jobs';

/** Uzun durum listesi yerine müşterinin gerçekten ayırdığı üç küme. */
const FILTERS = [
  { id: 'all', labelKey: 'jobFilter.all', status: undefined },
  {
    id: 'open',
    labelKey: 'jobFilter.open',
    status: [
      JobRequestStatus.DRAFT,
      JobRequestStatus.PUBLISHED,
      JobRequestStatus.OFFERS_RECEIVED,
      JobRequestStatus.PROVIDER_SELECTED,
      JobRequestStatus.SCHEDULED,
      JobRequestStatus.PROVIDER_EN_ROUTE,
      JobRequestStatus.IN_PROGRESS,
      JobRequestStatus.AWAITING_CUSTOMER_APPROVAL,
    ],
  },
  {
    id: 'closed',
    labelKey: 'jobFilter.closed',
    status: [JobRequestStatus.COMPLETED, JobRequestStatus.CANCELLED],
  },
] as const;

export function JobList() {
  const [filterId, setFilterId] = useState<(typeof FILTERS)[number]['id']>('all');
  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0];
  const jobs = useMyJobs(filter.status ? { status: [...filter.status] } : {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('job.statusFilterLabel')}>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilterId(item.id)}
            aria-pressed={item.id === filterId}
            className={
              item.id === filterId
                ? 'rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full border border-border px-4 py-1.5 text-sm text-foreground-muted hover:bg-surface-muted'
            }
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {jobs.isPending ? <ListSkeleton rows={3} /> : null}

      {jobs.isError ? (
        <ErrorState
          title={t('status.errorTitle')}
          description={t('job.listLoadFailed')}
          action={{ label: t('common.retry'), onClick: () => void jobs.refetch() }}
        />
      ) : null}

      {jobs.isSuccess && jobs.data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          {/* Süzgeç açıkken "hiç talep yok" demek yanıltıcı olur; talep vardır, o kümede yoktur. */}
          <EmptyState
            title={filterId === 'all' ? t('status.emptyJobs') : t('job.emptyFiltered')}
            description={
              filterId === 'all' ? t('job.emptyDescription') : t('job.emptyFilteredDescription')
            }
            className="w-full"
          />
          {filterId === 'all' ? (
            <Link href="/talep-olustur" className={buttonVariants()}>
              {t('nav.newRequest')}
            </Link>
          ) : null}
        </div>
      ) : null}

      {jobs.isSuccess && jobs.data.items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {jobs.data.items.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
