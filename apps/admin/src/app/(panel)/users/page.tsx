import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { UsersPanel } from '@/features/admin/users-panel';

export const metadata: Metadata = { title: 'Kullanıcılar' };

export default function UsersPage() {
  return (
    <>
      <Topbar
        title="Kullanıcılar"
        description="Müşteri, usta ve personel hesaplarını görüntüleyin ve yönetin."
      />

      <main className="flex-1 space-y-6 p-6">
        <UsersPanel />
      </main>
    </>
  );
}
