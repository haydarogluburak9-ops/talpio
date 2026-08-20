import { BrandLockup, cn } from '@talpio/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { t } from '@/lib/i18n';

import { AuthHeroVisual } from './auth-hero-visual';
import { AuthLegalFooter } from './auth-legal-footer';
import { authOutlineButtonClassName, authFormLightScopeClassName } from './auth-form-styles';

const brandLockupClass = 'h-7 sm:h-8';

/**
 * Instagram tarzı split-screen auth — sol görsel, sağ form; açık tema.
 */
export function AuthShell({
  title,
  description,
  eyebrow,
  children,
  footerText,
  footerHref,
  footerLinkLabel,
  showSecondaryAction = true,
  compact = false,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  footerText?: string;
  footerHref?: string;
  footerLinkLabel?: string;
  showSecondaryAction?: boolean;
  /** Kayıt gibi uzun formlar — tek ekrana sığdır, footer gizli. */
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col bg-white text-[#262626]',
        compact ? 'h-svh overflow-hidden' : 'min-h-svh',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full min-h-0 flex-1 flex-col lg:flex-row lg:items-center',
          compact
            ? 'max-w-[1120px] gap-4 px-4 py-3 lg:gap-10 lg:px-6 lg:py-4'
            : 'max-w-[935px] lg:gap-8 lg:px-8 xl:max-w-[980px]',
        )}
      >
        <aside
          className={cn(
            'relative hidden min-h-0 flex-col justify-center lg:flex',
            compact ? 'max-w-[460px] flex-1 py-2' : 'max-w-[580px] flex-1 py-10 lg:py-16',
          )}
        >
          <div className={compact ? 'mb-3' : 'mb-10'}>
            <Link href="/" aria-label={t('common.appName')}>
              <BrandLockup className={brandLockupClass} />
            </Link>
          </div>

          <div className={cn(compact && 'max-h-[min(34vh,240px)] scale-[0.92] origin-left')}>
            <AuthHeroVisual />
          </div>

          {!compact ? (
            <div className="mt-10 max-w-[420px]">
              <h2 className="font-sans text-[1.65rem] leading-snug font-semibold tracking-[-0.02em] text-[#0D1B2A] text-balance-safe xl:text-[1.85rem]">
                {t('home.heroTitleBefore')}{' '}
                <span className="text-[#FF5A0A]">{t('home.heroTitleAccent')}</span>
                {t('home.heroTitleMid')}{' '}
                {t('home.heroTitleAfter')}
              </h2>
            </div>
          ) : null}
        </aside>

        <div
          className={cn(
            'relative flex min-h-0 w-full flex-col',
            compact ? 'flex-1 lg:max-w-[520px]' : 'lg:w-[350px] lg:shrink-0',
          )}
        >
          <div className={cn('flex items-center justify-between lg:hidden', compact ? 'py-2' : 'px-4 py-4')}>
            <Link href="/" aria-label={t('common.appName')}>
              <BrandLockup className={brandLockupClass} />
            </Link>
            <LanguageSwitcher variant="landing" />
          </div>

          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col items-center justify-center',
              compact ? 'px-0 pb-2' : 'px-4 pb-6 sm:px-8 lg:px-0 lg:py-16',
            )}
          >
            <div
              className={cn(
                'flex w-full flex-col',
                authFormLightScopeClassName,
                compact ? 'max-w-[520px] gap-2.5' : 'max-w-[350px] gap-4',
              )}
            >
              <div className={cn('hidden justify-end lg:flex', compact ? 'mb-0.5' : 'mb-1')}>
                <LanguageSwitcher variant="landing" />
              </div>

              <div className={cn('flex flex-col', compact ? 'gap-0.5' : 'gap-1.5 text-center')}>
                {eyebrow ? (
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-accent-600 uppercase">{eyebrow}</p>
                ) : null}
                <h1 className={cn('font-semibold text-[#111827]', compact ? 'text-base' : 'text-[17px] font-normal text-[#262626]')}>
                  {title}
                </h1>
                {description && !compact ? (
                  <p className="text-sm leading-relaxed text-[#667085] text-balance-safe">{description}</p>
                ) : null}
              </div>

              {children}

              {showSecondaryAction && footerHref && footerLinkLabel ? (
                <Link href={footerHref} className={authOutlineButtonClassName}>
                  {footerLinkLabel}
                </Link>
              ) : null}

              {footerText && !showSecondaryAction ? (
                <p className="text-center text-sm text-[#667085]">
                  {footerText}{' '}
                  {footerHref && footerLinkLabel ? (
                    <Link href={footerHref} className="font-semibold text-accent-600 hover:underline">
                      {footerLinkLabel}
                    </Link>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {!compact ? <AuthLegalFooter /> : null}
    </div>
  );
}
