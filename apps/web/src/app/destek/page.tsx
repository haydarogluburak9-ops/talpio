import type { Metadata } from 'next';

import { SupportPageBody } from '@/features/support/support-page-body';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('support.listTitle'),
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <SupportPageBody />
    </div>
  );
}
