'use client';

import { formatRating } from '@ustapilot/localization';
import { Input, StatusPill } from '@ustapilot/ui';
import { VerificationStatus, type AdminProviderSummary } from '@ustapilot/types';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { canWrite, useSession } from '@/features/auth/use-session';
import { VERIFICATION_LABELS, VERIFICATION_TONES } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminProviders, useUpdateProviderVerification } from './use-admin';

const VERIFICATION_OPTIONS = Object.values(VerificationStatus).map((status) => ({
  value: status,
  label: VERIFICATION_LABELS[status],
}));

export interface ProvidersPanelProps {
  title: string;
  description: string;
  /**
   * Doğrulama ekranı yalnızca bekleyenleri gösterir; bu durumda filtre kutusu
   * gizlenir, aksi halde ekranın amacı kullanıcı tarafından bozulabilirdi.
   */
  lockedStatus?: VerificationStatus;
}

export function ProvidersPanel({ title, description, lockedStatus }: ProvidersPanelProps) {
  const session = useSession();
  const writable = canWrite(session.data);

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<VerificationStatus | 'all'>('all');
  const [rejecting, setRejecting] = useState<string | null>(null);
  // Arama kutusunu sıfırlamak için kullanılan sayaç; artınca kutu yenilenir.
  const [filterVersion, setFilterVersion] = useState(0);

  const effectiveStatus = lockedStatus ?? (status === 'all' ? undefined : status);

  const providers = useAdminProviders({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(effectiveStatus ? { verificationStatus: [effectiveStatus] } : {}),
  });

  const decide = useUpdateProviderVerification();

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminProviderSummary>[] = [
    {
      key: 'provider',
      header: 'Usta',
      cell: (provider) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{provider.displayName}</p>
          <p className="truncate text-xs text-foreground-muted">{provider.email}</p>
        </div>
      ),
    },
    {
      key: 'verification',
      header: 'Doğrulama',
      cell: (provider) => (
        <div className="flex flex-col gap-1">
          <StatusPill
            label={VERIFICATION_LABELS[provider.verificationStatus]}
            tone={VERIFICATION_TONES[provider.verificationStatus]}
          />
          {provider.pendingDocumentCount > 0 ? (
            <span className="text-xs text-foreground-muted">
              {provider.pendingDocumentCount} belge bekliyor
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Puan',
      hideBelow: 'md',
      cell: (provider) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatRating(provider.averageRating)}
          {provider.reviewCount > 0 ? ` (${provider.reviewCount})` : ''}
        </span>
      ),
    },
    {
      key: 'jobs',
      header: 'Tamamlanan',
      hideBelow: 'md',
      cell: (provider) => (
        <span className="tabular-nums text-foreground-muted">{provider.completedJobCount}</span>
      ),
    },
    {
      key: 'coverage',
      header: 'Hizmet / Bölge',
      hideBelow: 'lg',
      cell: (provider) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {provider.serviceCount} / {provider.serviceAreaCount}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Karar',
      align: 'right',
      cell: (provider) => (
        <VerificationActions
          provider={provider}
          disabled={!writable || decide.isPending}
          isRejecting={rejecting === provider.id}
          onStartReject={() => setRejecting(provider.id)}
          onCancelReject={() => setRejecting(null)}
          onApprove={() =>
            decide.mutate({ id: provider.id, status: VerificationStatus.VERIFIED })
          }
          onReject={(reason) => {
            decide.mutate({
              id: provider.id,
              status: VerificationStatus.REJECTED,
              ...(reason ? { reason } : {}),
            });
            setRejecting(null);
          }}
        />
      ),
    },
  ];

  const hasFilter = q !== '' || (!lockedStatus && status !== 'all');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>

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
              placeholder="İşletme adı, ad veya e-posta"
            />
            {lockedStatus ? null : (
              <FilterSelect
                label="Doğrulama durumu"
                value={status}
                options={VERIFICATION_OPTIONS}
                allLabel="Tüm durumlar"
                onChange={(value) => applyFilter(() => setStatus(value))}
              />
            )}
          </FilterBar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {decide.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            Karar kaydedilemedi. Yetkinizi ve bağlantınızı kontrol edin.
          </p>
        ) : null}

        <DataTable
          columns={columns}
          rows={providers.data?.items ?? []}
          rowKey={(provider) => provider.id}
          isPending={providers.isPending}
          isError={providers.isError}
          emptyLabel={
            lockedStatus
              ? 'İnceleme bekleyen usta yok.'
              : hasFilter
                ? 'Bu filtreye uyan usta yok.'
                : 'Kayıtlı usta bulunamadı.'
          }
          onRetry={() => void providers.refetch()}
          minWidth={900}
        />

        <TablePagination
          meta={providers.data?.meta}
          onPageChange={setPage}
          isFetching={providers.isFetching}
        />
      </CardContent>
    </Card>
  );
}

function VerificationActions({
  provider,
  disabled,
  isRejecting,
  onApprove,
  onReject,
  onStartReject,
  onCancelReject,
}: {
  provider: AdminProviderSummary;
  disabled: boolean;
  isRejecting: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onStartReject: () => void;
  onCancelReject: () => void;
}) {
  const [reason, setReason] = useState('');

  if (isRejecting) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ret gerekçesi"
          aria-label="Ret gerekçesi"
          className="max-w-48"
        />
        <Button variant="outline" size="sm" disabled={disabled} onClick={() => onReject(reason)}>
          Onayla
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancelReject}>
          Vazgeç
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {provider.verificationStatus === VerificationStatus.VERIFIED ? null : (
        <Button variant="outline" size="sm" disabled={disabled} onClick={onApprove}>
          Doğrula
        </Button>
      )}
      {provider.verificationStatus === VerificationStatus.REJECTED ? null : (
        <Button variant="ghost" size="sm" disabled={disabled} onClick={onStartReject}>
          Reddet
        </Button>
      )}
    </div>
  );
}
