import type { Metadata } from 'next';

import { AccountOverview } from '@/features/auth/account-overview';

export const metadata: Metadata = {
  title: 'Hesabım',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <AccountOverview />
    </div>
  );
}
