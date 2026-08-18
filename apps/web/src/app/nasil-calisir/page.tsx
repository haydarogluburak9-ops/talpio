import { Container, buttonVariants, cn } from '@talpio/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.howItWorks'),
  description: t('home.heroSubtitle'),
};

const steps = [
  { titleKey: 'home.stepRequestTitle', bodyKey: 'home.stepRequestBody' },
  { titleKey: 'home.stepOffersTitle', bodyKey: 'home.stepOffersBody' },
  { titleKey: 'home.stepChooseTitle', bodyKey: 'home.stepChooseBody' },
  { titleKey: 'home.stepPayTitle', bodyKey: 'home.stepPayBody' },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="hero-atmosphere pointer-events-none absolute inset-0" aria-hidden />
        <Container className="relative z-10 py-16 sm:py-20">
          <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Tal<span className="text-accent-400">pio</span>
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[3.1rem]">
            {t('home.howItWorks')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100/85 text-balance-safe sm:text-lg">
            {t('home.howItWorksHint')}
          </p>
        </Container>
      </section>

      <section className="relative overflow-hidden">
        <div className="page-wash pointer-events-none absolute inset-0" aria-hidden />
        <Container size="narrow" className="relative z-10 py-14 sm:py-16">
          <ol className="flex flex-col gap-10">
            {steps.map((step, index) => (
              <li
                key={step.titleKey}
                className="seller-benefit flex gap-5 border-t border-border/70 pt-8 first:border-t-0 first:pt-0"
                style={{ animationDelay: `${90 + index * 70}ms` }}
              >
                <span className="font-display text-4xl font-bold leading-none text-brand-200 tabular-nums dark:text-brand-700">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex flex-col gap-2 pt-1">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {t(step.titleKey)}
                  </h2>
                  <p className="text-sm leading-relaxed text-foreground-muted text-balance-safe sm:text-[0.95rem]">
                    {t(step.bodyKey)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="hero-atmosphere pointer-events-none absolute inset-0 opacity-90" aria-hidden />
        <Container className="relative z-10 flex flex-col gap-5 py-14 sm:py-16 lg:max-w-3xl">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('nav.newRequest')}
          </h2>
          <p className="max-w-lg text-base text-brand-100/85 text-balance-safe">
            {t('home.heroSubtitle')}
          </p>
          <Link
            href="/talep-olustur"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-fit bg-accent-500 px-7 font-semibold tracking-wide text-white hover:bg-accent-600',
            )}
          >
            {t('nav.newRequest')}
          </Link>
        </Container>
      </section>
    </>
  );
}
