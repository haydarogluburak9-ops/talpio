import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('nav.login', { descriptionKey: 'auth.loginTitle' });
}

export default async function LoginPage() {
  await applyRequestLocale();
  return (
    <AuthShell
      title={t('auth.loginFormHeading')}
      footerHref="/kayit"
      footerLinkLabel={t('auth.createAccount')}
    >
      <LoginForm />
    </AuthShell>
  );
}
