'use client';

import { useSyncExternalStore } from 'react';

import { readIsDark, subscribeToTheme } from '../lib/theme-mode';
import { cn } from '../lib/cn';

/**
 * Talpio marka varlıkları.
 * - Açık zemin: lacivert Talp + turuncu io
 * - Koyu zemin / koyu tema: beyaz Talp + turuncu io
 */

const APP_ICON_SRC = '/brand/talpio-logo.png?v=16';
const LOCKUP_LIGHT_SRC = '/brand/talpio-lockup-light.png?v=12';
const LOCKUP_DARK_SRC = '/brand/talpio-lockup-dark.png?v=12';

export type BrandLockupVariant = 'auto' | 'light' | 'dark';

/** App ikonu — çerçevesiz PNG, şeffaf zemin. */
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
    <span className={cn('relative inline-flex shrink-0 items-center', className ?? 'h-10 w-10')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={1024}
        height={985}
        className="block h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}

/** Yatay logo (T + Talpio). */
export function BrandLockup({
  className,
  alt = 'Talpio',
  variant = 'auto',
}: {
  className?: string;
  alt?: string;
  /** auto: tema; light: lacivert metin; dark: beyaz metin (koyu zemin). */
  variant?: BrandLockupVariant;
}) {
  const isDarkTheme = useSyncExternalStore(subscribeToTheme, readIsDark, () => false);
  const useDarkAsset = variant === 'dark' || (variant === 'auto' && isDarkTheme);
  const src = useDarkAsset ? LOCKUP_DARK_SRC : LOCKUP_LIGHT_SRC;

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
