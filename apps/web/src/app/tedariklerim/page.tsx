import type { Metadata } from 'next';

import { SocialShell } from '@/features/social/social-shell';
import { MyCommerceRequests } from '@/features/requests/my-commerce-requests';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('commerce.myListTitle', { robots: { index: false, follow: false } });
}

export default async function MyCommerceRequestsPage() {
  await applyRequestLocale();
  return (
    <SocialShell showRail={false}>
      <MyCommerceRequests />
    </SocialShell>
  );
}
