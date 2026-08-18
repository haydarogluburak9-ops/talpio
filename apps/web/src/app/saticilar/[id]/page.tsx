import type { Metadata } from 'next';

import { ProviderProfileBody } from '@/features/reviews/provider-profile-body';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('provider.profileTitle'),
};

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <ProviderProfileBody providerId={id} />
    </div>
  );
}
