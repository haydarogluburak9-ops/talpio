import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.login'),
  description: t('auth.loginTitle'),
};

export default function LoginPage() {
  return (
    <AuthShell
      title={t('auth.loginPageTitle')}
      description={t('auth.loginPageDescription')}
      footerText={t('auth.noAccount')}
      footerHref="/kayit"
      footerLinkLabel={t('auth.createNow')}
    >
      <LoginForm />
    </AuthShell>
  );
}
