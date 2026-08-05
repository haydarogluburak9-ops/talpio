'use client';

import { ComplaintSubjectType } from '@ustapilot/types';
import { LoadingState } from '@ustapilot/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { ComplaintForm } from '@/features/support/complaint-form';
import { t } from '@/lib/i18n';

function ComplaintPageInner() {
  const session = useSession();
  const router = useRouter();
  const search = useSearchParams();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  if (!user) return <LoadingState label={t('common.loading')} />;

  const subjectTypeParam = search.get('subjectType');
  const subjectId = search.get('subjectId') ?? user.id;
  const subjectType = isSubjectType(subjectTypeParam)
    ? subjectTypeParam
    : ComplaintSubjectType.USER;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t('complaint.createTitle')}</h1>
      <ComplaintForm subjectType={subjectType} subjectId={subjectId} />
    </div>
  );
}

function isSubjectType(value: string | null): value is ComplaintSubjectType {
  return (
    value === 'USER' ||
    value === 'JOB_REQUEST' ||
    value === 'OFFER' ||
    value === 'REVIEW' ||
    value === 'MESSAGE'
  );
}

export default function ComplaintPage() {
  return (
    <Suspense fallback={<LoadingState label={t('common.loading')} />}>
      <ComplaintPageInner />
    </Suspense>
  );
}
