import type { Metadata } from 'next';

import { AccountOverview } from '@/features/auth/account-overview';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.profile'),
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <SocialShell showRail={false}>
      <AccountOverview />
    </SocialShell>
  );
}
