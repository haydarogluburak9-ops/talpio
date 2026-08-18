'use client';

import { formatDate } from '@talpio/localization';
import { StatusPill } from '@talpio/ui';
import {
  UserRole,
  UserStatus,
  type AdminUserSummary,
  type VerificationStatus,
} from '@talpio/types';
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

import { getLocale, t } from '@/lib/i18n';

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
const STATUS_ACTIONS: { status: UserStatus; labelKey: 'admin.activate' | 'admin.suspend' | 'admin.ban' }[] = [
  { status: UserStatus.ACTIVE, labelKey: 'admin.activate' },
  { status: UserStatus.SUSPENDED, labelKey: 'admin.suspend' },
  { status: UserStatus.BANNED, labelKey: 'admin.ban' },
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
      header: t('admin.users'),
      cell: (user) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-foreground-muted">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('admin.colRole'),
      hideBelow: 'sm',
      cell: (user) => <span className="text-foreground-muted">{ROLE_LABELS[user.role]}</span>,
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      cell: (user) => (
        <StatusPill label={USER_STATUS_LABELS[user.status]} tone={USER_STATUS_TONES[user.status]} />
      ),
    },
    {
      key: 'verification',
      header: t('admin.colVerification'),
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
      header: t('admin.colJoined'),
      hideBelow: 'md',
      cell: (user) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDate(user.createdAt, getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('admin.colActions'),
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
        <CardTitle>{t('admin.usersTitle')}</CardTitle>
        <CardDescription>
          {writable ? t('admin.usersHintWrite') : t('admin.usersHintRead')}
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
              placeholder={t('admin.searchUsers')}
            />
            <FilterSelect
              label={t('admin.colRole')}
              value={role}
              options={ROLE_OPTIONS}
              allLabel={t('admin.allRoles')}
              onChange={(value) => applyFilter(() => setRole(value))}
            />
            <FilterSelect
              label={t('admin.colStatus')}
              value={status}
              options={STATUS_OPTIONS}
              allLabel={t('admin.allStatuses')}
              onChange={(value) => applyFilter(() => setStatus(value))}
            />
          </FilterBar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {updateStatus.isError || revoke.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            {t('admin.actionFailed')}
          </p>
        ) : null}

        <DataTable
          columns={columns}
          rows={users.data?.items ?? []}
          rowKey={(user) => user.id}
          isPending={users.isPending}
          isError={users.isError}
          emptyLabel={
            hasFilter ? t('admin.emptyFiltered') : t('admin.emptyUsers')
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
          {t(action.labelKey)}
        </Button>
      ))}
      <Button variant="ghost" size="sm" disabled={disabled} onClick={onRevoke}>
        {t('admin.revokeSessions')}
      </Button>
    </div>
  );
}
