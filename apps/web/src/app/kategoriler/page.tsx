import { Container, Section } from '@ustapilot/ui';
import type { Metadata } from 'next';

import { CategoryGrid } from '@/features/catalog/category-grid';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.categories'),
  description: t('home.heroSubtitle'),
};

export default function CategoriesPage() {
  return (
    <Container>
      <Section title={t('nav.categories')} description={t('home.heroSubtitle')}>
        <CategoryGrid />
      </Section>
    </Container>
  );
}
