import { cn } from '../lib/cn';

/**
 * Marka işaretleri. Logodaki iki renkli okumayı ("Usta" lacivert, "Pilot"
 * turuncu) arayüzde tekrar eder.
 *
 * Marka adı çeviriye tabi değildir, bu yüzden parçalar burada sabittir;
 * `common.appName` bütün ad gerektiğinde (başlık, meta) kullanılmaya devam eder.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-[--radius-control] bg-brand-900 text-sm font-bold text-white',
        className,
      )}
    >
      <span>
        U<span className="text-accent-500">P</span>
      </span>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-semibold tracking-tight text-foreground', className)}>
      Usta<span className="text-accent-500">Pilot</span>
    </span>
  );
}
