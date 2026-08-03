import type { Metadata } from 'next';

import { CreateJobForm } from '@/features/jobs/create-job-form';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Hizmet talebi oluştur',
  robots: { index: false, follow: false },
};

export default function CreateJobPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('job.createTitle')}</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Talebinizi yayınladığınızda bölgenizdeki doğrulanmış ustalar size teklif gönderebilir.
        </p>
      </div>

      <CreateJobForm />
    </div>
  );
}
