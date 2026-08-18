'use client';

import { ErrorState, ListSkeleton, LoadingState } from '@talpio/ui';
import Link from 'next/link';

import { useMyCommerceRequests } from './use-requests';

export function MyCommerceRequests() {
  const requests = useMyCommerceRequests();

  if (requests.isPending) return <LoadingState label="Talepler yükleniyor" />;
  if (requests.isError) {
    return (
      <ErrorState
        title="Talepler alınamadı"
        description="Ticaret talepleri yüklenemedi."
        action={{ label: 'Tekrar dene', onClick: () => void requests.refetch() }}
      />
    );
  }

  const items = requests.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-6">
      <header className="social-panel p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold text-brand-900 dark:text-foreground">
          Ticaret taleplerim
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          JobRequest listesi değil; CommerceRequest kayıtları.
        </p>
        <Link href="/tedarik" className="mt-3 inline-block text-sm font-semibold text-accent-600">
          Yeni talep
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="social-panel p-5 text-sm text-foreground-muted">Henüz ticaret talebi yok.</p>
      ) : (
        <ul className="social-panel divide-y divide-border/70">
          {items.map((row) => (
            <li key={row.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
              <Link href={`/tedarik/${row.id}`} className="font-medium hover:underline">
                {row.title}
              </Link>
              <span className="text-xs text-foreground-muted">{row.status}</span>
            </li>
          ))}
        </ul>
      )}
      {requests.isPending ? <ListSkeleton rows={2} /> : null}
    </div>
  );
}
