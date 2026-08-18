'use client';

import { SUPPORT_TICKET_STATUS_TONES } from '@talpio/config';
import { formatDateTime } from '@talpio/localization';
import { StatusPill, Textarea } from '@talpio/ui';
import {
  SupportTicketStatus,
  type AdminSupportTicketDetail,
  type AdminSupportTicketSummary,
} from '@talpio/types';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { SUPPORT_TICKET_STATUS_LABELS } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import {
  useAdminSupportTicket,
  useAdminSupportTickets,
  useReplySupportTicket,
  useUpdateSupportTicket,
} from './use-admin';

const STATUS_OPTIONS = Object.values(SupportTicketStatus).map((status) => ({
  value: status,
  label: SUPPORT_TICKET_STATUS_LABELS[status],
}));

const LOCALE = 'tr';

export function SupportPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<SupportTicketStatus | 'all'>('all');
  const [filterVersion, setFilterVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tickets = useAdminSupportTickets({
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

  const columns: TableColumn<AdminSupportTicketSummary>[] = [
    {
      key: 'ticket',
      header: 'Talep',
      cell: (ticket) => (
        <button
          type="button"
          className="min-w-0 text-left"
          onClick={() => setSelectedId(ticket.id)}
        >
          <p className="truncate font-medium hover:underline">{ticket.subject}</p>
          <p className="truncate text-xs text-foreground-muted">
            {ticket.userName} · {ticket.messageCount} mesaj
          </p>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (ticket) => (
        <StatusPill
          label={SUPPORT_TICKET_STATUS_LABELS[ticket.status]}
          tone={SUPPORT_TICKET_STATUS_TONES[ticket.status]}
        />
      ),
    },
    {
      key: 'assignee',
      header: 'Atanan',
      hideBelow: 'md',
      cell: (ticket) => (
        <span className="text-sm text-foreground-muted">{ticket.assignedToName ?? '—'}</span>
      ),
    },
    {
      key: 'updated',
      header: 'Son mesaj',
      hideBelow: 'lg',
      align: 'right',
      cell: (ticket) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(ticket.lastMessageAt ?? ticket.createdAt, LOCALE)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Destek talepleri</CardTitle>
          <CardDescription>
            Kullanıcı destek taleplerini yanıtlayın, atayın ve sonuçlandırın.
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
                placeholder="Konu, kullanıcı adı veya e-posta"
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
            rows={tickets.data?.items ?? []}
            rowKey={(ticket) => ticket.id}
            isPending={tickets.isPending}
            isError={tickets.isError}
            emptyLabel={hasFilter ? 'Bu filtreye uyan talep yok.' : 'Destek talebi bulunamadı.'}
            onRetry={() => void tickets.refetch()}
            minWidth={900}
          />

          <TablePagination
            meta={tickets.data?.meta}
            onPageChange={setPage}
            isFetching={tickets.isFetching}
          />
        </CardContent>
      </Card>

      {selectedId ? (
        <TicketDetailCard ticketId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}

function TicketDetailCard({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const detail = useAdminSupportTicket(ticketId);
  const update = useUpdateSupportTicket();
  const reply = useReplySupportTicket();
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<SupportTicketStatus | ''>('');

  if (detail.isPending) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-foreground-muted">Talep yükleniyor…</CardContent>
      </Card>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-6">
          <p className="text-sm text-danger-600">Talep yüklenemedi.</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </CardContent>
      </Card>
    );
  }

  const ticket: AdminSupportTicketDetail = detail.data;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate">{ticket.subject}</CardTitle>
          <CardDescription>
            {ticket.userName} · {ticket.userEmail}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            label={SUPPORT_TICKET_STATUS_LABELS[ticket.status]}
            tone={SUPPORT_TICKET_STATUS_TONES[ticket.status]}
          />
          <select
            className="h-9 rounded-[--radius-control] border border-border bg-surface px-2 text-sm"
            value={status || ticket.status}
            onChange={(event) => setStatus(event.target.value as SupportTicketStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                id: ticket.id,
                body: { status: (status || ticket.status) as SupportTicketStatus },
              })
            }
          >
            Durumu kaydet
          </Button>
        </div>

        <ol className="max-h-80 space-y-2 overflow-y-auto rounded-[--radius-card] border border-border p-3">
          {ticket.messages.map((message) => (
            <li key={message.id} className="rounded-[--radius-control] bg-surface-muted px-3 py-2">
              <p className="text-xs text-foreground-muted">
                {message.isFromStaff ? 'Personel' : 'Kullanıcı'} ·{' '}
                {formatDateTime(message.createdAt, LOCALE)}
              </p>
              <p className="whitespace-pre-wrap text-sm">{message.body}</p>
            </li>
          ))}
        </ol>

        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Personel yanıtı yazın"
            rows={3}
          />
          <Button
            size="sm"
            disabled={reply.isPending || body.trim().length === 0}
            onClick={() =>
              reply.mutate(
                { id: ticket.id, body: { body: body.trim(), attachmentFileIds: [] } },
                { onSuccess: () => setBody('') },
              )
            }
          >
            Yanıt gönder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
