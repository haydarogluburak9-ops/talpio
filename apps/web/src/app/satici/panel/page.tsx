import type { Metadata } from 'next';

import { ProviderDashboard } from '@/features/auth/provider-dashboard';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('provider.dashboardTitle', { robots: { index: false, follow: false } });
}

export default async function ProviderDashboardPage() {
  await applyRequestLocale();
  return (
    <SocialShell showRail={false}>
      <ProviderDashboard />
    </SocialShell>
  );
}
