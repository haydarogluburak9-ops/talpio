import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = {
  title: 'Giriş yap',
  description: 'UstaPilot hesabınıza giriş yaparak taleplerinizi ve tekliflerinizi yönetin.',
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Giriş yap"
      description="Taleplerinizi, tekliflerinizi ve mesajlarınızı görmek için hesabınıza girin."
      footerText="Hesabınız yok mu?"
      footerHref="/kayit"
      footerLinkLabel="Hemen oluşturun"
    >
      <LoginForm />
    </AuthShell>
  );
}
