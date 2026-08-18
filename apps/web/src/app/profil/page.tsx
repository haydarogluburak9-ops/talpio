import type { Metadata } from 'next';

import { ProfilePageBody } from '@/features/profile/profile-page-body';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('profile.title', { robots: { index: false, follow: false } });
}

export default async function ProfilePage() {
  await applyRequestLocale();
  return (
    <SocialShell showRail={false}>
      <div className="social-panel p-5 sm:p-6">
        <ProfilePageBody />
      </div>
    </SocialShell>
  );
}
