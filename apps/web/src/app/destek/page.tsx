import type { Metadata } from 'next';

import { SupportPageBody } from '@/features/support/support-page-body';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('support.listTitle', { robots: { index: false, follow: false } });
}

export default async function SupportPage() {
  await applyRequestLocale();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <SupportPageBody />
    </div>
  );
}
