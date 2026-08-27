import type { Metadata } from 'next';

import { RequestDetail } from '@/features/requests/request-detail';
import { SocialShell } from '@/features/social/social-shell';
import { generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('commerce.detailTitle', { robots: { index: false, follow: false } });
}

export default async function TedarikDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SocialShell showRail={false}>
      <RequestDetail id={id} />
    </SocialShell>
  );
}
