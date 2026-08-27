import type { Metadata } from 'next';

import { AccountOverview } from '@/features/auth/account-overview';
import { SocialShell } from '@/features/social/social-shell';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('nav.profile', { robots: { index: false, follow: false } });
}

export default async function AccountPage() {
  await applyRequestLocale();
  return (
    <SocialShell showRail={false}>
      <AccountOverview />
    </SocialShell>
  );
}
