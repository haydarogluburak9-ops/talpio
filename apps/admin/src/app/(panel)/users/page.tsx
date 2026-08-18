import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { UsersPanel } from '@/features/admin/users-panel';

import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.users') };

export default function UsersPage() {
  return (
    <>
      <Topbar titleKey="admin.users" descriptionKey="admin.usersHint" />

      <main className="flex-1 space-y-6 p-6">
        <UsersPanel />
      </main>
    </>
  );
}
