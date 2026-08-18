'use client';

import { REVIEW_STATUS_TONES } from '@talpio/config';
import { formatDateTime } from '@talpio/localization';
import { StatusPill } from '@talpio/ui';
import { ReviewStatus, type AdminReviewSummary } from '@talpio/types';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { REVIEW_STATUS_LABELS } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminReviews, useUpdateReviewModeration } from './use-admin';

const STATUS_OPTIONS = Object.values(ReviewStatus).map((status) => ({
  value: status,
  label: REVIEW_STATUS_LABELS[status],
}));

const LOCALE = 'tr';

export function ReviewsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ReviewStatus | 'all'>('all');
  const [filterVersion, setFilterVersion] = useState(0);

  const reviews = useAdminReviews({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(status === 'all' ? {} : { status: [status] }),
  });

  const update = useUpdateReviewModeration();

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const hasFilter = q !== '' || status !== 'all';

  const columns: TableColumn<AdminReviewSummary>[] = [
    {
      key: 'review',
      header: 'Değerlendirme',
      cell: (review) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{review.jobTitle}</p>
          <p className="truncate text-xs text-foreground-muted">
            {review.customerName} → {review.providerName}
          </p>
          {review.comment ? (
            <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{review.comment}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Puan',
      cell: (review) => (
        <span className="tabular-nums font-medium">{review.overallRating.toFixed(1)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (review) => (
        <div className="space-y-1">
          <StatusPill
            label={REVIEW_STATUS_LABELS[review.status]}
            tone={REVIEW_STATUS_TONES[review.status]}
          />
          {review.moderationNote ? (
            <p className="max-w-48 text-xs text-foreground-muted">{review.moderationNote}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'reply',
      header: 'Yanıt',
      hideBelow: 'md',
      cell: (review) => (
        <span className="text-foreground-muted">{review.hasReply ? 'Var' : 'Yok'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tarih',
      hideBelow: 'lg',
      align: 'right',
      cell: (review) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(review.createdAt, LOCALE)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlem',
      align: 'right',
      cell: (review) => (
        <div className="flex flex-wrap justify-end gap-2">
          {review.status !== ReviewStatus.PUBLISHED ? (
            <Button
              size="sm"
              variant="outline"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  id: review.id,
                  body: { status: ReviewStatus.PUBLISHED },
                })
              }
            >
              Yayınla
            </Button>
          ) : null}
          {review.status !== ReviewStatus.HIDDEN ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  id: review.id,
                  body: { status: ReviewStatus.HIDDEN },
                })
              }
            >
              Gizle
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Değerlendirmeler</CardTitle>
        <CardDescription>
          Yorumları inceleyin; kural dışı içerikleri gizleyin veya yeniden yayınlayın.
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
              placeholder="Yorum, müşteri, satıcı veya talep"
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
          rows={reviews.data?.items ?? []}
          rowKey={(review) => review.id}
          isPending={reviews.isPending}
          isError={reviews.isError}
          emptyLabel={
            hasFilter ? 'Bu filtreye uyan değerlendirme yok.' : 'Kayıtlı değerlendirme bulunamadı.'
          }
          onRetry={() => void reviews.refetch()}
          minWidth={960}
        />

        <TablePagination
          meta={reviews.data?.meta}
          onPageChange={setPage}
          isFetching={reviews.isFetching}
        />
      </CardContent>
    </Card>
  );
}
