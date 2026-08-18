import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { OffersPanel } from '@/features/admin/offers-panel';

import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.offers') };

export default function OffersPage() {
  return (
    <>
      <Topbar titleKey="admin.offers" descriptionKey="admin.offersHint" />

      <main className="flex-1 space-y-6 p-6">
        <OffersPanel />
      </main>
    </>
  );
}
