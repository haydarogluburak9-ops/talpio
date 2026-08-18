import type { Metadata } from 'next';

import { ProviderDashboard } from '@/features/auth/provider-dashboard';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('provider.dashboardTitle'),
  robots: { index: false, follow: false },
};

export default function ProviderDashboardPage() {
  return (
    <SocialShell showRail={false}>
      <ProviderDashboard />
    </SocialShell>
  );
}
