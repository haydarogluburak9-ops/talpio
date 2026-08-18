import { Container, Section } from '@talpio/ui';
import type { Metadata } from 'next';

import { SystemStatusCard } from '@/features/system-status/system-status-card';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('system.statusTitle'),
  description: t('system.statusSubtitle'),
  robots: { index: false, follow: false },
};

export default function SystemStatusPage() {
  return (
    <Container size="narrow">
      <Section title={t('system.statusTitle')} description={t('system.statusSubtitle')}>
        <SystemStatusCard />
      </Section>
    </Container>
  );
}
