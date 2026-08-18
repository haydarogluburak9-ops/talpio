import type { Metadata } from 'next';

import { NewTicketPageBody } from '@/features/support/support-page-body';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('support.createTitle'),
  robots: { index: false, follow: false },
};

export default function NewSupportTicketPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <NewTicketPageBody />
    </div>
  );
}
