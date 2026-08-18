import type { Metadata } from 'next';

import { CreateJobForm } from '@/features/jobs/create-job-form';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('job.createTitle', { robots: { index: false, follow: false } });
}

export default async function CreateJobPage() {
  await applyRequestLocale();
  return (
    <SocialShell showRail={false}>
      <div className="social-panel mb-4 p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('job.createTitle')}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t('job.createHint')}
        </p>
      </div>
      <div className="social-panel p-5 sm:p-6">
        <CreateJobForm />
      </div>
    </SocialShell>
  );
}
