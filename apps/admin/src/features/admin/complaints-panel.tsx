'use client';

import { COMPLAINT_STATUS_TONES } from '@ustapilot/config';
import { formatDateTime } from '@ustapilot/localization';
import { StatusPill, Textarea } from '@ustapilot/ui';
import { ComplaintStatus, type AdminComplaintSummary } from '@ustapilot/types';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { COMPLAINT_STATUS_LABELS, COMPLAINT_SUBJECT_LABELS } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminComplaints, useUpdateComplaint } from './use-admin';

const STATUS_OPTIONS = Object.values(ComplaintStatus).map((status) => ({
  value: status,
  label: COMPLAINT_STATUS_LABELS[status],
}));

const LOCALE = 'tr';

export function ComplaintsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ComplaintStatus | 'all'>('all');
  const [filterVersion, setFilterVersion] = useState(0);
  const [selected, setSelected] = useState<AdminComplaintSummary | null>(null);

  const complaints = useAdminComplaints({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(status === 'all' ? {} : { status: [status] }),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const hasFilter = q !== '' || status !== 'all';

  const columns: TableColumn<AdminComplaintSummary>[] = [
    {
      key: 'complaint',
      header: 'Şikâyet',
      cell: (item) => (
        <button type="button" className="min-w-0 text-left" onClick={() => setSelected(item)}>
          <p className="truncate font-medium hover:underline">{item.reason}</p>
          <p className="truncate text-xs text-foreground-muted">
            {item.reporterName} · {COMPLAINT_SUBJECT_LABELS[item.subjectType]}
          </p>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (item) => (
        <StatusPill
          label={COMPLAINT_STATUS_LABELS[item.status]}
          tone={COMPLAINT_STATUS_TONES[item.status]}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Tarih',
      hideBelow: 'lg',
      align: 'right',
      cell: (item) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(item.createdAt, LOCALE)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Şikâyetler</CardTitle>
          <CardDescription>
            Kullanıcı şikâyetlerini inceleyin ve karara bağlayın.
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
                placeholder="Neden, kullanıcı adı veya e-posta"
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
            rows={complaints.data?.items ?? []}
            rowKey={(item) => item.id}
            isPending={complaints.isPending}
            isError={complaints.isError}
            emptyLabel={hasFilter ? 'Bu filtreye uyan şikâyet yok.' : 'Şikâyet bulunamadı.'}
            onRetry={() => void complaints.refetch()}
            minWidth={800}
          />

          <TablePagination
            meta={complaints.data?.meta}
            onPageChange={setPage}
            isFetching={complaints.isFetching}
          />
        </CardContent>
      </Card>

      {selected ? (
        <ComplaintDetailCard
          complaint={selected}
          onClose={() => setSelected(null)}
          onUpdated={(item) => setSelected(item)}
        />
      ) : null}
    </div>
  );
}

function ComplaintDetailCard({
  complaint,
  onClose,
  onUpdated,
}: {
  complaint: AdminComplaintSummary;
  onClose: () => void;
  onUpdated: (item: AdminComplaintSummary) => void;
}) {
  const update = useUpdateComplaint();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [note, setNote] = useState(complaint.resolutionNote ?? '');

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate">{complaint.reason}</CardTitle>
          <CardDescription>
            {complaint.reporterName} · {complaint.reporterEmail} ·{' '}
            {COMPLAINT_SUBJECT_LABELS[complaint.subjectType]}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {complaint.description ? (
          <p className="whitespace-pre-wrap text-sm text-foreground-muted">{complaint.description}</p>
        ) : null}

        <select
          className="h-9 rounded-[--radius-control] border border-border bg-surface px-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as ComplaintStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Çözüm notu"
          rows={3}
        />

        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              {
                id: complaint.id,
                body: { status, resolutionNote: note.trim() || undefined },
              },
              { onSuccess: (item) => onUpdated(item) },
            )
          }
        >
          Kararı kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
