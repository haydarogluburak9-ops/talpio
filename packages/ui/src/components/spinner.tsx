import { cn } from '../lib/cn';

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label ?? 'Yükleniyor'}
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}
