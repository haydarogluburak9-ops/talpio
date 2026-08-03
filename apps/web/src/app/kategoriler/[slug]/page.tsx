import { Card, CardContent, Container, Section, buttonVariants } from '@ustapilot/ui';
import Link from 'next/link';

import { t } from '@/lib/i18n';

import { CategoryDetail } from './category-detail';

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Container>
      <Section>
        <CategoryDetail slug={slug} />

        <Card className="mt-8">
          <CardContent className="flex flex-col items-start gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground-muted text-balance-safe">
              {t('home.heroSubtitle')}
            </p>
            <Link href="/nasil-calisir" className={buttonVariants({ size: 'sm' })}>
              {t('nav.howItWorks')}
            </Link>
          </CardContent>
        </Card>
      </Section>
    </Container>
  );
}
