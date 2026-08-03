import { Card, CardContent, Container, Section } from '@ustapilot/ui';
import { BadgeCheck, Bell, MapPin, Wallet } from 'lucide-react';
import type { Metadata } from 'next';

import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.becomeProvider'),
  description: t('home.heroSubtitle'),
};

const benefits = [
  { icon: Bell, titleKey: 'home.stepOffersTitle', bodyKey: 'home.stepOffersBody' },
  { icon: MapPin, titleKey: 'home.nearbyProviders', bodyKey: 'home.heroSubtitle' },
  { icon: BadgeCheck, titleKey: 'home.stepChooseTitle', bodyKey: 'home.stepChooseBody' },
  { icon: Wallet, titleKey: 'home.stepPayTitle', bodyKey: 'home.stepPayBody' },
];

export default function BecomeProviderPage() {
  return (
    <Container>
      <Section title={t('nav.becomeProvider')} description={t('home.heroSubtitle')}>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <Card key={benefit.titleKey}>
              <CardContent className="flex items-start gap-3 pt-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-[--radius-control] bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-200">
                  <benefit.icon className="size-5" aria-hidden />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold">{t(benefit.titleKey)}</h2>
                  <p className="text-sm text-foreground-muted text-balance-safe">
                    {t(benefit.bodyKey)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </Container>
  );
}
