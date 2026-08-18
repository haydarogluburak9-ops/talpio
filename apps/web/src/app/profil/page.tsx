import type { Metadata } from 'next';

import { ProfilePageBody } from '@/features/profile/profile-page-body';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('profile.title'),
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <SocialShell showRail={false}>
      <div className="social-panel p-5 sm:p-6">
        <ProfilePageBody />
      </div>
    </SocialShell>
  );
}
