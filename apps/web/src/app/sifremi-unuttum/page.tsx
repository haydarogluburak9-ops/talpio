'use client';

import { ApiError } from '@talpio/api-client';
import { Button, Field, Input } from '@talpio/ui';
import { useState } from 'react';

import { AuthShell } from '@/features/auth/auth-shell';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiClient.auth.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.networkError'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title={t('auth.forgotPassword')}
      description={t('auth.forgotSent')}
      footerText={t('auth.alreadyHaveAccount')}
      footerHref="/giris"
      footerLinkLabel={t('nav.login')}
    >
      {done ? (
        <p className="text-sm text-foreground-muted">{t('auth.forgotSent')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error ? (
            <p role="alert" className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface">
              {error}
            </p>
          ) : null}
          <Field label={t('auth.email')} required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            )}
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t('common.loading') : t('auth.forgotPassword')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
