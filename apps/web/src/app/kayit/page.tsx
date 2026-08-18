import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { RegisterForm } from '@/features/auth/register-form';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('auth.registerTitle'),
  description: t('home.heroSubtitle'),
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow={t('auth.registerEyebrow')}
      title={t('auth.registerTitle')}
      description={t('auth.registerDescription')}
      footerText={t('auth.alreadyHaveAccount')}
      footerHref="/giris"
      footerLinkLabel={t('nav.login')}
    >
      <RegisterForm />
    </AuthShell>
  );
}
