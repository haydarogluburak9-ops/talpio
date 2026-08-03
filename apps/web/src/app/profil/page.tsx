import type { Metadata } from 'next';

import { ProfilePageBody } from '@/features/profile/profile-page-body';

export const metadata: Metadata = {
  title: 'Profilim',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <ProfilePageBody />
    </div>
  );
}
