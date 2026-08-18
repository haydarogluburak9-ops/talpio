import type { Metadata } from 'next';

import { TicketDetailBody } from '@/features/support/support-page-body';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('support.detailTitle'),
  robots: { index: false, follow: false },
};

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <TicketDetailBody ticketId={id} />
    </div>
  );
}
