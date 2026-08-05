'use client';

import { LoadingState } from '@ustapilot/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { SupportListHeader, TicketList } from './ticket-list';
import { TicketForm } from './ticket-form';
import { TicketDetailBody } from './ticket-detail';

export function SupportPageBody() {
  const user = useAuthenticatedUser();
  if (!user) return <LoadingState label={t('common.loading')} />;

  return (
    <>
      <SupportListHeader />
      <TicketList />
    </>
  );
}

export function NewTicketPageBody() {
  const user = useAuthenticatedUser();
  if (!user) return <LoadingState label={t('common.loading')} />;
  return <TicketForm />;
}

export { TicketDetailBody };

function useAuthenticatedUser() {
  const session = useSession();
  const router = useRouter();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  return user;
}
