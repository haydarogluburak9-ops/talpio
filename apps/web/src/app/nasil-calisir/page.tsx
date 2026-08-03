import { Card, CardContent, Container, Section } from '@ustapilot/ui';
import type { Metadata } from 'next';

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
];

export default function HowItWorksPage() {
  return (
    <Container size="narrow">
      <Section title={t('home.howItWorks')} description={t('home.heroSubtitle')}>
        <ol className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <li key={step.titleKey}>
              <Card>
                <CardContent className="flex gap-4 pt-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold">{t(step.titleKey)}</h2>
                    <p className="text-sm text-foreground-muted text-balance-safe">
                      {t(step.bodyKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </Section>
    </Container>
  );
}
