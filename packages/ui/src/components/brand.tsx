import { cn } from '../lib/cn';

/**
 * Talpio marka varlıkları (kullanıcı logoları).
 * - Birincil logo: `/brand/talpio-logo.png` — app ikonu (BrandMark)
 * - Yatay lockup: `/brand/talpio-lockup.png` — yalnızca gerektiğinde (BrandLockup)
 */

const APP_ICON_SRC = '/brand/talpio-logo.png?v=12';
const LOCKUP_SRC = '/brand/talpio-lockup.png?v=11';

/** iOS app ikonu squircle — köşeler şeffaf, koyu panelde düzgün oturur. */
const BRAND_MARK_RADIUS = 'rounded-[22.37%]';

/** Kare app ikonu — koyu zemin, turuncu T (marka kimliği). */
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
        'relative inline-flex shrink-0 overflow-hidden',
        BRAND_MARK_RADIUS,
        className ?? 'h-10 w-10',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}

/** Yatay logo (T + Talpio) — beyaz zemin header. */
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
    <span className={cn('inline-flex shrink-0 items-center', className ?? 'h-7 sm:h-8')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block h-full w-auto object-contain object-left"
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
