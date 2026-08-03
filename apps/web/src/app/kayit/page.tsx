import { UserRole } from '@ustapilot/types';
import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata: Metadata = {
  title: 'Hesap oluştur',
  description: 'UstaPilot hesabı oluşturun; hizmet alın veya usta olarak iş bulun.',
};

/** `/kayit?rol=usta` bağlantısı usta seçeneğiyle açılır. */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const { rol } = await searchParams;
  const defaultRole = rol === 'usta' ? UserRole.PROVIDER : UserRole.CUSTOMER;

  return (
    <AuthShell
      title="Hesap oluştur"
      description="Birkaç adımda kaydolun, dakikalar içinde teklif almaya başlayın."
      footerText="Zaten hesabınız var mı?"
      footerHref="/giris"
      footerLinkLabel="Giriş yapın"
    >
      <RegisterForm defaultRole={defaultRole} />
    </AuthShell>
  );
}
