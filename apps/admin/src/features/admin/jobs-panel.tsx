'use client';

import { formatRelativeTime } from '@talpio/localization';
import { Badge, StatusPill } from '@talpio/ui';
import { JobRequestStatus, type AdminJobSummary } from '@talpio/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { JOB_STATUS_LABELS, JOB_STATUS_TONES } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminJobs } from './use-admin';

const STATUS_OPTIONS = Object.values(JobRequestStatus).map((status) => ({
  value: status,
  label: JOB_STATUS_LABELS[status],
}));

export function JobsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<JobRequestStatus | 'all'>('all');
  // Arama kutusunu sıfırlamak için kullanılan sayaç; artınca kutu yenilenir.
  const [filterVersion, setFilterVersion] = useState(0);

  const jobs = useAdminJobs({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(status === 'all' ? {} : { status: [status] }),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminJobSummary>[] = [
    {
      key: 'job',
      header: 'Talep',
      cell: (job) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{job.title}</p>
            {job.isUrgent ? <Badge tone="danger">Acil</Badge> : null}
          </div>
          <p className="truncate text-xs text-foreground-muted">{job.categoryName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (job) => (
        <StatusPill label={JOB_STATUS_LABELS[job.status]} tone={JOB_STATUS_TONES[job.status]} />
      ),
    },
    {
      key: 'customer',
      header: 'Müşteri',
      hideBelow: 'md',
      cell: (job) => <span className="text-foreground-muted">{job.customerName}</span>,
    },
    {
      key: 'location',
      header: 'Konum',
      hideBelow: 'lg',
      cell: (job) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {job.districtName}, {job.cityName}
        </span>
      ),
    },
    {
      key: 'offers',
      header: 'Teklif',
      hideBelow: 'sm',
      cell: (job) => <span className="tabular-nums text-foreground-muted">{job.offerCount}</span>,
    },
    {
      key: 'createdAt',
      header: 'Oluşturma',
      align: 'right',
      cell: (job) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatRelativeTime(job.createdAt)}
        </span>
      ),
    },
  ];

  const hasFilter = q !== '' || status !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle>İş talepleri</CardTitle>
        <CardDescription>
          Platformdaki tüm talepler. Filtreleyerek açık, tamamlanan veya itirazlı işleri ayırın.
        </CardDescription>

        <div className="pt-2">
          <FilterBar
            canReset={hasFilter}
            onReset={() =>
              applyFilter(() => {
                setQ('');
                setStatus('all');
                setFilterVersion((version) => version + 1);
              })
            }
          >
            <SearchField
              key={filterVersion}
              onChange={(value) => applyFilter(() => setQ(value))}
              placeholder="Talep başlığı"
            />
            <FilterSelect
              label="Durum"
              value={status}
              options={STATUS_OPTIONS}
              allLabel="Tüm durumlar"
              onChange={(value) => applyFilter(() => setStatus(value))}
            />
          </FilterBar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <DataTable
          columns={columns}
          rows={jobs.data?.items ?? []}
          rowKey={(job) => job.id}
          isPending={jobs.isPending}
          isError={jobs.isError}
          emptyLabel={hasFilter ? 'Bu filtreye uyan talep yok.' : 'Kayıtlı talep bulunamadı.'}
          onRetry={() => void jobs.refetch()}
          minWidth={880}
        />

        <TablePagination meta={jobs.data?.meta} onPageChange={setPage} isFetching={jobs.isFetching} />
      </CardContent>
    </Card>
  );
}
