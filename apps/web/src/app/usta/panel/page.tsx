import type { Metadata } from 'next';

import { ProviderDashboard } from '@/features/auth/provider-dashboard';

export const metadata: Metadata = {
  title: 'Usta paneli',
  robots: { index: false, follow: false },
};

export default function ProviderDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <ProviderDashboard />
    </div>
  );
}
