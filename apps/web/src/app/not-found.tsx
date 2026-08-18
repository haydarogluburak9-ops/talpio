import { Container, Section, buttonVariants } from '@talpio/ui';
import Link from 'next/link';

import { t } from '@/lib/i18n';

export default function NotFound() {
  return (
    <Container size="narrow">
      <Section className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('status.notFoundTitle')}</h1>
        <p className="mt-2 text-sm text-foreground-muted">{t('status.errorMessage')}</p>
        <Link href="/" className={`${buttonVariants({ size: 'sm' })} mt-6`}>
          {t('nav.home')}
        </Link>
      </Section>
    </Container>
  );
}
