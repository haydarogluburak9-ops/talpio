import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Button } from './button';
import { Spinner } from './spinner';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton rounded-[--radius-control]', className)} {...props} />;
}

export interface StateViewProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: StateViewProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[--radius-card] border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="text-foreground-muted">{icon}</div> : null}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-foreground-muted text-balance-safe">{description}</p>
      ) : null}
      {action ? (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({ title, description, action, className }: StateViewProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[--radius-card] border border-danger-500/30 bg-danger-50 px-6 py-10 text-center dark:bg-danger-500/10',
        className,
      )}
    >
      <p className="text-base font-semibold text-danger-700 dark:text-danger-500">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-foreground-muted text-balance-safe">{description}</p>
      ) : null}
      {action ? (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Belirsiz süreli yükleme göstergesi. `aria-live` yerine `role="status"`
 * kullanılır; ekran okuyucu metni bir kez, kesintiye uğratmadan duyurur.
 */
export function LoadingState({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12', className)}
    >
      <Spinner />
      <p className="text-sm text-foreground-muted">{label}</p>
    </div>
  );
}

export interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

export function ListSkeleton({ rows = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}
