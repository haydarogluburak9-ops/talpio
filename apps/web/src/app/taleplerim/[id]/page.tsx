import { buttonVariants } from '@talpio/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { JobDetail } from '@/features/jobs/job-detail';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('job.detailTitle', { robots: { index: false, follow: false } });
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await applyRequestLocale();
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/taleplerim" className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mb-4`}>
        ← {t('job.listTitle')}
      </Link>

      <JobDetail jobId={id} />
    </div>
  );
}
