import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { ChangePasswordForm } from '@/features/auth/change-password-form';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.account') };

export default function AccountPage() {
  return (
    <>
      <Topbar titleKey="admin.account" descriptionKey="admin.accountHint" />

      <main className="flex-1 space-y-6 p-6">
        <ChangePasswordForm />
      </main>
    </>
  );
}
