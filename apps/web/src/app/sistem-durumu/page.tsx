import { Container, Section } from '@talpio/ui';
import type { Metadata } from 'next';

import { SystemStatusCard } from '@/features/system-status/system-status-card';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('system.statusTitle', { descriptionKey: 'system.statusSubtitle', robots: { index: false, follow: false } });
}

export default async function SystemStatusPage() {
  await applyRequestLocale();
  return (
    <Container size="narrow">
      <Section title={t('system.statusTitle')} description={t('system.statusSubtitle')}>
        <SystemStatusCard />
      </Section>
    </Container>
  );
}
