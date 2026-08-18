'use client';

import { ApiError } from '@talpio/api-client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthShell } from '@/features/auth/auth-shell';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

function VerifyBody() {
  const token = useSearchParams().get('token') ?? '';
  const [status, setStatus] = useState<'working' | 'done' | 'failed'>('working');

  useEffect(() => {
    if (token.length < 16) {
      setStatus('failed');
      return;
    }
    void apiClient.auth
      .verifyEmail(token)
      .then(() => setStatus('done'))
      .catch((error: unknown) => {
        setStatus(error instanceof ApiError ? 'failed' : 'failed');
      });
  }, [token]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground-muted">
        {status === 'working'
          ? t('auth.verifyEmailWorking')
          : status === 'done'
            ? t('auth.verifyEmailDone')
            : t('auth.verifyEmailFailed')}
      </p>
      {status !== 'working' ? (
        <Link href="/giris" className="text-sm font-semibold text-accent-600 hover:underline">
          {t('nav.login')}
        </Link>
      ) : null}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title={t('auth.verifyEmailTitle')}
      description={t('auth.verifyEmailWorking')}
      footerText={t('auth.alreadyHaveAccount')}
      footerHref="/giris"
      footerLinkLabel={t('nav.login')}
    >
      <Suspense fallback={<p className="text-sm text-foreground-muted">{t('common.loading')}</p>}>
        <VerifyBody />
      </Suspense>
    </AuthShell>
  );
}
