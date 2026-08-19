import { cn } from '../lib/cn';

/**
 * Talpio marka varlıkları (kullanıcı logoları).
 * - App ikon: `/brand/talpio-logo.png` — koyu zemin / auth paneli (BrandMark)
 * - Yatay lockup: `/brand/talpio-lockup.png` — açık zemin header (BrandLockup)
 */

const APP_ICON_SRC = '/brand/talpio-logo.png';
const LOCKUP_SRC = '/brand/talpio-lockup.png';

/** Kare uygulama ikonu. */
export function BrandMark({
  className,
  src = APP_ICON_SRC,
  alt = 'Talpio',
}: {
  className?: string;
  src?: string;
  alt?: string;
}) {
  return (
    <span
      className={cn(
        'relative block size-10 shrink-0 overflow-hidden rounded-[22%] bg-transparent',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="size-full object-contain" draggable={false} />
    </span>
  );
}

/** Yatay logo (T + Talpio) — sol bar üstü için. */
export function BrandLockup({
  className,
  src = LOCKUP_SRC,
  alt = 'Talpio',
}: {
  className?: string;
  src?: string;
  alt?: string;
}) {
  return (
    <span className={cn('relative inline-flex h-10 w-auto max-w-full shrink-0 items-center', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block h-full w-auto max-w-none object-contain object-left"
        draggable={false}
      />
    </span>
  );
}

/** Metin wordmark — logo asset yokken yedek. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-semibold tracking-tight text-brand-900 dark:text-foreground',
        className,
      )}
    >
      Talp<span className="text-[#FF6A00]">io</span>
    </span>
  );
}
