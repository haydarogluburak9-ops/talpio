import { buttonVariants } from '@talpio/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { JobList } from '@/features/jobs/job-list';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('job.listTitle', { robots: { index: false, follow: false } });
}

export default async function MyJobsPage() {
  await applyRequestLocale();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t('job.listTitle')}</h1>
        <Link href="/talep-olustur" className={buttonVariants()}>
          {t('nav.newRequest')}
        </Link>
      </div>

      <JobList />
    </div>
  );
}
