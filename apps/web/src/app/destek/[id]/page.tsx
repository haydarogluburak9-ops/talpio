import type { Metadata } from 'next';

import { TicketDetailBody } from '@/features/support/support-page-body';
import { generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('support.detailTitle', { robots: { index: false, follow: false } });
}

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
