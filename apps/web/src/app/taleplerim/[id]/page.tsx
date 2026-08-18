import { buttonVariants } from '@talpio/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { JobDetail } from '@/features/jobs/job-detail';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('job.detailTitle'),
  robots: { index: false, follow: false },
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
