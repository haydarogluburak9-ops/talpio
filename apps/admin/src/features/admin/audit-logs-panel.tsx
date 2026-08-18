'use client';

import { formatDateTime } from '@talpio/localization';
import type { AuditLogEntry } from '@talpio/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { AUDIT_ACTION_LABELS } from '@/lib/labels';

import { FilterSelect } from './filter-bar';
import { useAuditLogs } from './use-admin';

const ENTITY_OPTIONS = [
  { value: 'User', label: 'Kullanıcı' },
  { value: 'ProviderProfile', label: 'Satıcı profili' },
];

export function AuditLogsPanel() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string | 'all'>('all');

  const logs = useAuditLogs({
    page,
    limit: 20,
    ...(entityType === 'all' ? {} : { entityType }),
  });

  const columns: TableColumn<AuditLogEntry>[] = [
    {
      key: 'action',
      header: 'İşlem',
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{AUDIT_ACTION_LABELS[log.action] ?? log.action}</p>
          <p className="truncate font-mono text-xs text-foreground-muted">{log.action}</p>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Yapan',
      cell: (log) => (
        <span className="text-foreground-muted">{log.actorName ?? 'Silinmiş hesap'}</span>
      ),
    },
    {
      key: 'entity',
      header: 'Kayıt',
      hideBelow: 'md',
      cell: (log) => (
        <span className="font-mono text-xs text-foreground-muted">
          {log.entityType}
          {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ''}
        </span>
      ),
    },
    {
      key: 'changes',
      header: 'Değişiklik',
      hideBelow: 'lg',
      cell: (log) => <ChangeSummary changes={log.changes} />,
    },
    {
      key: 'createdAt',
      header: 'Zaman',
      align: 'right',
      cell: (log) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(log.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Denetim kayıtları</CardTitle>
        <CardDescription>
          Yönetim işlemlerinin değiştirilemez izi. Kim, neyi, ne zaman değiştirdi.
        </CardDescription>

        <div className="pt-2">
          <FilterSelect
            label="Kayıt türü"
            value={entityType}
            options={ENTITY_OPTIONS}
            allLabel="Tüm kayıt türleri"
            onChange={(value) => {
              setEntityType(value);
              setPage(1);
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <DataTable
          columns={columns}
          rows={logs.data?.items ?? []}
          rowKey={(log) => log.id}
          isPending={logs.isPending}
          isError={logs.isError}
          emptyLabel="Henüz denetim kaydı yok."
          onRetry={() => void logs.refetch()}
          minWidth={900}
        />

        <TablePagination meta={logs.data?.meta} onPageChange={setPage} isFetching={logs.isFetching} />
      </CardContent>
    </Card>
  );
}

/**
 * `changes` serbest biçimli olduğu için anahtar/değer çiftleri olduğu gibi
 * yazılır. Her işleme özel bir gösterim yazmak, yeni işlem eklendiğinde
 * panelin sessizce eksik kalmasına yol açardı.
 */
function ChangeSummary({ changes }: { changes: AuditLogEntry['changes'] }) {
  if (!changes) return <span className="text-foreground-muted">—</span>;

  // JSON sütunundan gelen anahtar sırası garanti değildir; sabit sıra olmadan
  // aynı işlem satır satır farklı dizilişte görünürdü.
  const entries = Object.entries(changes)
    .filter(([, value]) => value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return <span className="text-foreground-muted">—</span>;

  return (
    <ul className="space-y-0.5 text-xs text-foreground-muted">
      {entries.map(([key, value]) => (
        <li key={key} className="truncate">
          <span className="font-mono">{key}</span>: {String(value)}
        </li>
      ))}
    </ul>
  );
}
