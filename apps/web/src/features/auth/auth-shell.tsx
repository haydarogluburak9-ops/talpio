import { BrandMark } from '@talpio/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { t } from '@/lib/i18n';

/**
 * Giriş ve kayıt sayfalarının ortak kabuğu.
 *
 * Geniş ekranda sol panel marka atmosferi taşır; form sağda kalır. Dar
 * ekranda tek sütuna düşer — kart çerçevesi bilinçli olarak kullanılmaz;
 * odak form alanlarındadır.
 */
export function AuthShell({
  title,
  description,
  eyebrow,
  children,
  footerText,
  footerHref,
  footerLinkLabel,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkLabel: string;
}) {
  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-2 lg:items-stretch">
      <aside className="relative hidden overflow-hidden bg-brand-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="hero-atmosphere pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10">
          <BrandMark className="size-[3.75rem] sm:size-16" />
        </div>
        <div className="relative z-10 flex max-w-sm flex-col gap-4">
          <p className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            {t('common.tagline')}
          </p>
          <p className="text-sm leading-relaxed text-brand-100/80">{t('home.heroSubtitle')}</p>
          <Link
            href="/akis"
            className="inline-flex h-11 w-fit items-center rounded-xl bg-accent-500 px-5 text-sm font-semibold text-white hover:bg-accent-600"
          >
            {t('nav.feed')}
          </Link>
        </div>
        <div className="relative z-10">
          <BrandMark className="size-14 opacity-90" />
        </div>
      </aside>

      <div className="relative flex flex-col justify-center gap-7 px-4 py-10 sm:px-8 sm:py-14 lg:px-14">
        <div className="relative mb-1 overflow-hidden rounded-2xl bg-brand-900 px-5 py-5 text-white lg:hidden">
          <div className="hero-atmosphere pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10">
            <BrandMark className="size-14" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl dark:text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-foreground-muted text-balance-safe">{description}</p>
        </div>

        <div className="flex flex-col gap-5">{children}</div>

        <p className="text-sm text-foreground-muted">
          {footerText}{' '}
          <Link
            href={footerHref}
            className="font-medium text-brand-700 underline-offset-4 hover:underline dark:text-accent-400"
          >
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
