import type { Metadata } from 'next';

import { LoginPageBody } from '@/features/auth/login-page-body';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('nav.login') };

export default function LoginPage() {
  return <LoginPageBody />;
}
