'use client';

import type { PaginationMeta } from '@ustapilot/types';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export interface TableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Dar ekranlarda gizlenecek ikincil kolonlar. */
  hideBelow?: 'sm' | 'md' | 'lg';
  align?: 'right';
}

const HIDE_CLASSES = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const;

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isPending: boolean;
  isError: boolean;
  emptyLabel: string;
  errorLabel?: string;
  onRetry?: () => void;
  /** Satır sayısına göre en az genişlik; dar ekranda yatay kaydırma yapılır. */
  minWidth?: number;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isPending,
  isError,
  emptyLabel,
  errorLabel = 'Kayıtlar alınamadı. API sunucusunun çalıştığını doğrulayın.',
  onRetry,
  minWidth = 720,
}: DataTableProps<T>) {
  if (isPending) {
    return <p className="py-6 text-sm text-foreground-muted">Yükleniyor…</p>;
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-6">
        <p className="text-sm text-danger-on-surface">{errorLabel}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tekrar dene
          </Button>
        ) : null}
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="py-6 text-sm text-foreground-muted">{emptyLabel}</p>;
  }

  return (
    // Dar ekranda tablo yatay kaydırılır; hücreler sıkışıp okunmaz hâle gelmez.
    <div className="-mx-6 overflow-x-auto px-6">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-foreground-muted">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cellClass(column, 'py-2 pr-4 font-medium')}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-0 align-middle">
              {columns.map((column) => (
                <td key={column.key} className={cellClass(column, 'py-3 pr-4')}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellClass<T>(column: TableColumn<T>, base: string): string {
  return [base, column.hideBelow ? HIDE_CLASSES[column.hideBelow] : '', column.align === 'right' ? 'text-right' : '']
    .filter(Boolean)
    .join(' ');
}

export function TablePagination({
  meta,
  onPageChange,
  isFetching,
}: {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  isFetching: boolean;
}) {
  if (!meta || meta.total === 0) return null;

  const first = (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-xs text-foreground-muted" aria-live="polite">
        {meta.total} kayıttan {first}–{last} gösteriliyor
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPreviousPage || isFetching}
        >
          Önceki
        </Button>
        <span className="text-xs text-foreground-muted">
          {meta.page} / {Math.max(meta.totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage || isFetching}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
}
