'use client';

import { formatDate } from '@ustapilot/localization';
import { StatusPill } from '@ustapilot/ui';
import {
  UserRole,
  UserStatus,
  type AdminUserSummary,
  type VerificationStatus,
} from '@ustapilot/types';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { canWrite, useSession } from '@/features/auth/use-session';
import {
  ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONES,
  VERIFICATION_LABELS,
  VERIFICATION_TONES,
} from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminUsers, useRevokeUserSessions, useUpdateUserStatus } from './use-admin';

const ROLE_OPTIONS = Object.values(UserRole).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

const STATUS_OPTIONS = Object.values(UserStatus).map((status) => ({
  value: status,
  label: USER_STATUS_LABELS[status],
}));

/** Yönetimin uygulayabileceği geçişler; kayıt akışına ait durumlar dışarıda. */
const STATUS_ACTIONS: { status: UserStatus; label: string }[] = [
  { status: UserStatus.ACTIVE, label: 'Etkinleştir' },
  { status: UserStatus.SUSPENDED, label: 'Askıya al' },
  { status: UserStatus.BANNED, label: 'Engelle' },
];

export function UsersPanel() {
  const session = useSession();
  const writable = canWrite(session.data);

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  // Arama kutusunu sıfırlamak için kullanılan sayaç; artınca kutu yenilenir.
  const [filterVersion, setFilterVersion] = useState(0);

  const users = useAdminUsers({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(role === 'all' ? {} : { role: [role] }),
    ...(status === 'all' ? {} : { status: [status] }),
  });

  const updateStatus = useUpdateUserStatus();
  const revoke = useRevokeUserSessions();

  /** Filtre değişince ilk sayfaya dönülür; aksi halde boş sayfa gösterilir. */
  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminUserSummary>[] = [
    {
      key: 'user',
      header: 'Kullanıcı',
      cell: (user) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-foreground-muted">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      hideBelow: 'sm',
      cell: (user) => <span className="text-foreground-muted">{ROLE_LABELS[user.role]}</span>,
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (user) => (
        <StatusPill label={USER_STATUS_LABELS[user.status]} tone={USER_STATUS_TONES[user.status]} />
      ),
    },
    {
      key: 'verification',
      header: 'Doğrulama',
      hideBelow: 'lg',
      cell: (user) =>
        user.verificationStatus ? (
          <StatusPill
            label={VERIFICATION_LABELS[user.verificationStatus as VerificationStatus]}
            tone={VERIFICATION_TONES[user.verificationStatus as VerificationStatus]}
          />
        ) : (
          <span className="text-foreground-muted">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Katılım',
      hideBelow: 'md',
      cell: (user) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDate(user.createdAt, 'tr', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlem',
      align: 'right',
      cell: (user) => (
        <UserActions
          user={user}
          disabled={!writable || updateStatus.isPending || revoke.isPending}
          onStatusChange={(next) => updateStatus.mutate({ id: user.id, status: next })}
          onRevoke={() => revoke.mutate(user.id)}
        />
      ),
    },
  ];

  const hasFilter = q !== '' || role !== 'all' || status !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kullanıcılar</CardTitle>
        <CardDescription>
          {writable
            ? 'Hesapları arayın, durumlarını değiştirin ve oturumlarını kapatın.'
            : 'Destek rolü hesapları görüntüleyebilir; durum değişikliği admin yetkisi ister.'}
        </CardDescription>

        <div className="pt-2">
          <FilterBar
            canReset={hasFilter}
            onReset={() =>
              applyFilter(() => {
                setQ('');
                setRole('all');
                setStatus('all');
                setFilterVersion((version) => version + 1);
              })
            }
          >
            <SearchField
              key={filterVersion}
              onChange={(value) => applyFilter(() => setQ(value))}
              placeholder="Ad, e-posta veya telefon"
            />
            <FilterSelect
              label="Rol"
              value={role}
              options={ROLE_OPTIONS}
              allLabel="Tüm roller"
              onChange={(value) => applyFilter(() => setRole(value))}
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
        {updateStatus.isError || revoke.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            İşlem tamamlanamadı. Yetkinizi ve bağlantınızı kontrol edin.
          </p>
        ) : null}

        <DataTable
          columns={columns}
          rows={users.data?.items ?? []}
          rowKey={(user) => user.id}
          isPending={users.isPending}
          isError={users.isError}
          emptyLabel={
            hasFilter ? 'Bu filtreye uyan kullanıcı yok.' : 'Kayıtlı kullanıcı bulunamadı.'
          }
          onRetry={() => void users.refetch()}
          minWidth={860}
        />

        <TablePagination meta={users.data?.meta} onPageChange={setPage} isFetching={users.isFetching} />
      </CardContent>
    </Card>
  );
}

function UserActions({
  user,
  disabled,
  onStatusChange,
  onRevoke,
}: {
  user: AdminUserSummary;
  disabled: boolean;
  onStatusChange: (status: UserStatus) => void;
  onRevoke: () => void;
}) {
  const actions = STATUS_ACTIONS.filter((action) => action.status !== user.status);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {actions.map((action) => (
        <Button
          key={action.status}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onStatusChange(action.status)}
        >
          {action.label}
        </Button>
      ))}
      <Button variant="ghost" size="sm" disabled={disabled} onClick={onRevoke}>
        Oturumları kapat
      </Button>
    </div>
  );
}
