import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { RegisterForm } from '@/features/auth/register-form';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('auth.registerTitle', { descriptionKey: 'home.heroSubtitle' });
}

export default async function RegisterPage() {
  await applyRequestLocale();
  return (
    <AuthShell
      compact
      eyebrow={t('auth.registerEyebrow')}
      title={t('auth.registerTitle')}
      footerHref="/giris"
      footerLinkLabel={t('nav.login')}
    >
      <RegisterForm />
    </AuthShell>
  );
}
