import { BrandLockup } from '@talpio/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { t } from '@/lib/i18n';

import { AuthHeroVisual } from './auth-hero-visual';
import { AuthLegalFooter } from './auth-legal-footer';
import { authOutlineButtonClassName } from './auth-form-styles';

const brandLockupClass = 'h-8 sm:h-9';

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
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  footerText?: string;
  footerHref?: string;
  footerLinkLabel?: string;
  showSecondaryAction?: boolean;
}) {
  return (
    <div className="relative flex min-h-svh flex-col bg-white text-[#262626]">
      <div className="mx-auto flex w-full max-w-[935px] flex-1 flex-col lg:flex-row lg:items-center lg:gap-8 lg:px-8 xl:max-w-[980px]">
        <aside className="relative hidden min-h-0 flex-1 flex-col justify-center py-10 lg:flex lg:max-w-[580px] lg:py-16">
          <div className="mb-10">
            <Link href="/" aria-label={t('common.appName')}>
              <BrandLockup className={brandLockupClass} />
            </Link>
          </div>

          <AuthHeroVisual />

          <div className="mt-10 max-w-[420px]">
            <h2 className="font-sans text-[1.65rem] leading-snug font-semibold tracking-[-0.02em] text-[#0D1B2A] text-balance-safe xl:text-[1.85rem]">
              {t('home.heroTitleBefore')}{' '}
              <span className="text-[#FF5A0A]">{t('home.heroTitleAccent')}</span>
              {t('home.heroTitleMid')}{' '}
              {t('home.heroTitleAfter')}
            </h2>
          </div>
        </aside>

        <div className="relative flex w-full flex-col lg:w-[350px] lg:shrink-0">
          <div className="flex items-center justify-between px-4 py-4 lg:hidden">
            <Link href="/" aria-label={t('common.appName')}>
              <BrandLockup className={brandLockupClass} />
            </Link>
            <LanguageSwitcher variant="landing" />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 sm:px-8 lg:px-0 lg:py-16">
            <div className="flex w-full max-w-[350px] flex-col gap-4">
              <div className="mb-1 hidden justify-end lg:flex">
                <LanguageSwitcher variant="landing" />
              </div>

              <div className="flex flex-col gap-1.5 text-center">
                {eyebrow ? (
                  <p className="text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">{eyebrow}</p>
                ) : null}
                <h1 className="text-[17px] font-normal text-[#262626]">{title}</h1>
                {description ? (
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

      <AuthLegalFooter />
    </div>
  );
}
