'use client';

import { BrandMark, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@talpio/ui';

import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { LoginForm } from '@/features/auth/login-form';
import { t } from '@/lib/i18n';

export function LoginPageBody() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-16" />
          <p className="text-sm text-foreground-muted">{t('admin.panel')}</p>
          <LanguageSwitcher />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.loginTitle')}</CardTitle>
            <CardDescription>{t('admin.loginHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
