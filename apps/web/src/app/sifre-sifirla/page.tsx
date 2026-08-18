'use client';

import { ApiError } from '@talpio/api-client';
import { Button, Field, Input } from '@talpio/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthShell } from '@/features/auth/auth-shell';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiClient.auth.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.networkError'));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-foreground-muted">{t('auth.resetDone')}</p>
        <Link href="/giris" className="text-sm font-semibold text-accent-600 hover:underline">
          {t('nav.login')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface">
          {error}
        </p>
      ) : null}
      <Field label={t('auth.password')} required hint={t('auth.passwordHint')}>
        {(props) => (
          <Input
            {...props}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        )}
      </Field>
      <Button type="submit" className="w-full" disabled={pending || token.length < 16}>
        {pending ? t('common.loading') : t('auth.resetSubmit')}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title={t('auth.resetTitle')}
      description={t('auth.passwordHint')}
      footerText={t('auth.alreadyHaveAccount')}
      footerHref="/giris"
      footerLinkLabel={t('nav.login')}
    >
      <Suspense fallback={<p className="text-sm text-foreground-muted">{t('common.loading')}</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
