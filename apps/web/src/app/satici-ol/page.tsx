import { Container } from '@talpio/ui';
import { BadgeCheck, Bell, Megaphone, MessagesSquare } from 'lucide-react';
import type { Metadata } from 'next';

import { SellerHeroVisual } from '@/components/seller/seller-hero-visual';
import { BecomeProviderCta } from '@/features/auth/become-provider-cta';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('nav.becomeProvider', { descriptionKey: 'becomeProvider.subtitle' });
}

const benefits = [
  {
    icon: Bell,
    titleKey: 'becomeProvider.benefitJobsTitle' as const,
    bodyKey: 'becomeProvider.benefitJobsBody' as const,
  },
  {
    icon: BadgeCheck,
    titleKey: 'becomeProvider.benefitOffersTitle' as const,
    bodyKey: 'becomeProvider.benefitOffersBody' as const,
  },
  {
    icon: Megaphone,
    titleKey: 'becomeProvider.benefitPayTitle' as const,
    bodyKey: 'becomeProvider.benefitPayBody' as const,
  },
  {
    icon: MessagesSquare,
    titleKey: 'becomeProvider.benefitChatTitle' as const,
    bodyKey: 'becomeProvider.benefitChatBody' as const,
  },
];

export default async function BecomeProviderPage() {
  await applyRequestLocale();
  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="hero-atmosphere pointer-events-none absolute inset-0" aria-hidden />
        <Container className="relative z-10 grid items-center gap-10 py-16 sm:py-20 lg:min-h-[min(86svh,760px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-24">
          <div className="hero-copy order-2 flex max-w-xl flex-col gap-6 lg:order-1 lg:gap-7">
            <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Tal<span className="text-accent-400">pio</span>
            </p>
            <h1 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-balance-safe sm:text-4xl lg:text-[3.15rem]">
              {t('becomeProvider.title')}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-brand-100/90 text-balance-safe sm:text-lg">
              {t('becomeProvider.subtitle')}
            </p>
            <BecomeProviderCta />
          </div>
          <div className="order-1 lg:order-2">
            <SellerHeroVisual />
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-background">
        <div
          className="seller-section-wash pointer-events-none absolute inset-0"
          aria-hidden
        />
        <Container className="relative z-10 py-16 sm:py-20">
          <ul className="grid gap-10 sm:grid-cols-2 lg:gap-x-14 lg:gap-y-12">
            {benefits.map((benefit, index) => (
              <li
                key={benefit.titleKey}
                className="seller-benefit group flex gap-5 border-t border-border/80 pt-8 first:border-t-0 first:pt-0 sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+2)]:pt-0"
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-900 text-accent-400 ring-1 ring-brand-800/40 transition-transform duration-500 group-hover:-translate-y-0.5">
                  <benefit.icon className="size-5" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="font-display text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase dark:text-accent-400">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {t(benefit.titleKey)}
                  </h2>
                  <p className="max-w-sm text-sm leading-relaxed text-foreground-muted text-balance-safe sm:text-[0.95rem]">
                    {t(benefit.bodyKey)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="hero-atmosphere pointer-events-none absolute inset-0 opacity-90" aria-hidden />
        <Container className="relative z-10 flex flex-col gap-6 py-16 sm:py-20 lg:max-w-3xl">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('becomeProvider.cta')}
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-brand-100/85 text-balance-safe">
            {t('becomeProvider.subtitle')}
          </p>
          <BecomeProviderCta />
        </Container>
      </section>
    </>
  );
}
