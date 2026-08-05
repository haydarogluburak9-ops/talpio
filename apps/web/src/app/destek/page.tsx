import type { Metadata } from 'next';

import { SupportPageBody } from '@/features/support/support-page-body';

export const metadata: Metadata = {
  title: 'Destek',
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <SupportPageBody />
    </div>
  );
}
