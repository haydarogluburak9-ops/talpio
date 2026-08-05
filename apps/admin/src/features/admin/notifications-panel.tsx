'use client';

import { formatDateTime, renderNotification } from '@ustapilot/localization';
import { StatusPill } from '@ustapilot/ui';
import { NotificationType, type AdminNotificationSummary } from '@ustapilot/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminNotifications } from './use-admin';

const TYPE_OPTIONS = Object.values(NotificationType).map((type) => ({
  value: type,
  label: type,
}));

const LOCALE = 'tr';

export function NotificationsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [type, setType] = useState<NotificationType | 'all'>('all');
  const [unread, setUnread] = useState<'all' | 'unread'>('all');
  const [filterVersion, setFilterVersion] = useState(0);

  const notifications = useAdminNotifications({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(type === 'all' ? {} : { type: [type] }),
    ...(unread === 'unread' ? { unread: true } : {}),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const hasFilter = q !== '' || type !== 'all' || unread !== 'all';

  const columns: TableColumn<AdminNotificationSummary>[] = [
    {
      key: 'notification',
      header: 'Bildirim',
      cell: (item) => {
        const rendered = renderNotification(item.type, item.params, LOCALE);
        return (
          <div className="min-w-0">
            <p className="truncate font-medium">{rendered.title}</p>
            <p className="truncate text-xs text-foreground-muted">{rendered.body}</p>
          </div>
        );
      },
    },
    {
      key: 'recipient',
      header: 'Alıcı',
      hideBelow: 'md',
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{item.recipientName}</p>
          <p className="truncate font-mono text-xs text-foreground-muted">{item.recipientEmail}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tür',
      hideBelow: 'lg',
      cell: (item) => <span className="font-mono text-xs">{item.type}</span>,
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (item) => (
        <StatusPill
          label={item.readAt ? 'Okundu' : 'Okunmadı'}
          tone={item.readAt ? 'neutral' : 'info'}
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
    <Card>
      <CardHeader>
        <CardTitle>Gönderilen bildirimler</CardTitle>
        <CardDescription>
          Uygulama içi kayıtlar; metin istemci tarafında tür ve parametrelerden çözülür.
        </CardDescription>

        <div className="pt-2">
          <FilterBar
            canReset={hasFilter}
            onReset={() =>
              applyFilter(() => {
                setQ('');
                setType('all');
                setUnread('all');
                setFilterVersion((version) => version + 1);
              })
            }
          >
            <SearchField
              key={filterVersion}
              onChange={(value) => applyFilter(() => setQ(value))}
              placeholder="Alıcı adı veya e-posta"
            />
            <FilterSelect
              label="Tür"
              value={type}
              options={TYPE_OPTIONS}
              allLabel="Tüm türler"
              onChange={(value) => applyFilter(() => setType(value))}
            />
            <FilterSelect
              label="Okunma"
              value={unread}
              options={[{ value: 'unread', label: 'Okunmamış' }]}
              allLabel="Tümü"
              onChange={(value) => applyFilter(() => setUnread(value))}
            />
          </FilterBar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <DataTable
          columns={columns}
          rows={notifications.data?.items ?? []}
          rowKey={(item) => item.id}
          isPending={notifications.isPending}
          isError={notifications.isError}
          emptyLabel={hasFilter ? 'Bu filtreye uyan bildirim yok.' : 'Bildirim kaydı bulunamadı.'}
          onRetry={() => void notifications.refetch()}
          minWidth={900}
        />

        <TablePagination
          meta={notifications.data?.meta}
          onPageChange={setPage}
          isFetching={notifications.isFetching}
        />
      </CardContent>
    </Card>
  );
}
