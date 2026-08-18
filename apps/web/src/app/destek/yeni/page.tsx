import type { Metadata } from 'next';

import { NewTicketPageBody } from '@/features/support/support-page-body';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('support.createTitle', { robots: { index: false, follow: false } });
}

export default async function NewSupportTicketPage() {
  await applyRequestLocale();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <NewTicketPageBody />
    </div>
  );
}
