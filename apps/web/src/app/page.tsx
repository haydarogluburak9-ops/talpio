import { Card, CardContent, Container, Section, buttonVariants, cn } from '@ustapilot/ui';
import { BadgeCheck, MessageSquare, ShieldCheck, Wallet } from 'lucide-react';
import Link from 'next/link';

import { CategoryGrid } from '@/features/catalog/category-grid';
import { t } from '@/lib/i18n';

const steps = [
  { titleKey: 'home.stepRequestTitle', bodyKey: 'home.stepRequestBody' },
  { titleKey: 'home.stepOffersTitle', bodyKey: 'home.stepOffersBody' },
  { titleKey: 'home.stepChooseTitle', bodyKey: 'home.stepChooseBody' },
  { titleKey: 'home.stepPayTitle', bodyKey: 'home.stepPayBody' },
];

const trustPoints = [
  { icon: BadgeCheck, titleKey: 'home.stepChooseTitle', bodyKey: 'home.stepChooseBody' },
  { icon: ShieldCheck, titleKey: 'home.stepPayTitle', bodyKey: 'home.stepPayBody' },
  { icon: MessageSquare, titleKey: 'home.stepOffersTitle', bodyKey: 'home.stepOffersBody' },
  { icon: Wallet, titleKey: 'home.stepRequestTitle', bodyKey: 'home.stepRequestBody' },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-brand-50 to-background dark:from-brand-950 dark:to-background">
        <Container className="py-12 sm:py-16 lg:py-20">
          <div className="flex max-w-2xl flex-col gap-5">
            <h1 className="text-3xl font-bold tracking-tight text-balance-safe sm:text-4xl lg:text-5xl">
              {t('home.heroTitle')}
            </h1>
            <p className="text-base text-foreground-muted text-balance-safe sm:text-lg">
              {t('home.heroSubtitle')}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/kategoriler" className={buttonVariants({ size: 'lg' })}>
                {t('nav.categories')}
              </Link>
              <Link
                href="/usta-ol"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                {t('nav.becomeProvider')}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <Section title={t('home.popularCategories')}>
          <CategoryGrid limit={10} />
          <div className="mt-5">
            <Link
              href="/kategoriler"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              {t('common.showMore')}
            </Link>
          </div>
        </Section>

        <Section title={t('home.howItWorks')}>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.titleKey}>
                <Card className="h-full">
                  <CardContent className="flex flex-col gap-2 pt-5">
                    <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-semibold">{t(step.titleKey)}</h3>
                    <p className="text-sm text-foreground-muted text-balance-safe">
                      {t(step.bodyKey)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t('home.trustTitle')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <Card key={point.titleKey}>
                <CardContent className="flex items-start gap-3 pt-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[--radius-control] bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                    <point.icon className="size-5" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold">{t(point.titleKey)}</h3>
                    <p className="text-sm text-foreground-muted text-balance-safe">
                      {t(point.bodyKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </Container>
    </>
  );
}
