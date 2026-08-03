'use client';

import { UserRole } from '@ustapilot/types';
import { ErrorState, ListSkeleton, LoadingState } from '@ustapilot/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { AccountProfileForm } from './account-profile-form';
import { ProviderAreasForm } from './provider-areas-form';
import { ProviderProfileForm } from './provider-profile-form';
import { ProviderServicesForm } from './provider-services-form';
import { useMyServices, useProviderProfile } from './use-profile';

/**
 * Profil sayfası gövdesi.
 *
 * Sunucu bileşeni olarak yazılamaz: oturum bilgisi yalnızca tarayıcıdaki
 * HTTP-only çerezle yapılan `/auth/me` çağrısından gelir.
 */
export function ProfilePageBody() {
  const session = useSession();
  const router = useRouter();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  if (session.isError) {
    return (
      <ErrorState
        title={t('profile.loadFailed')}
        description="Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin."
        action={{ label: 'Tekrar dene', onClick: () => void session.refetch() }}
      />
    );
  }

  if (!user) return <LoadingState label="Profil yükleniyor" />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('profile.title')}</h1>

      <AccountProfileForm user={user} />

      {user.role === UserRole.PROVIDER ? <ProviderSections /> : null}
    </div>
  );
}

/** Usta bölümleri ayrı bir bileşende: müşteri hesabında bu sorgular hiç açılmaz. */
function ProviderSections() {
  const profile = useProviderProfile();
  const services = useMyServices();

  if (profile.isError) {
    return (
      <ErrorState
        title={t('profile.loadFailed')}
        action={{ label: 'Tekrar dene', onClick: () => void profile.refetch() }}
      />
    );
  }

  if (!profile.data || !services.data) return <ListSkeleton rows={4} />;

  return (
    <>
      <ProviderProfileForm profile={profile.data} />
      <ProviderServicesForm services={services.data} />
      <ProviderAreasForm areas={profile.data.serviceAreas} />
    </>
  );
}
