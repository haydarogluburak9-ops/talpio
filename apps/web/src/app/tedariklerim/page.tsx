import type { Metadata } from 'next';

import { SocialShell } from '@/features/social/social-shell';
import { MyCommerceRequests } from '@/features/requests/my-commerce-requests';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('commerce.myListTitle'),
  robots: { index: false, follow: false },
};

export default function MyCommerceRequestsPage() {
  return (
    <SocialShell showRail={false}>
      <MyCommerceRequests />
    </SocialShell>
  );
}
