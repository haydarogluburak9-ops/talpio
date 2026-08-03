import type { Metadata } from 'next';

import { ProviderProfileBody } from '@/features/reviews/provider-profile-body';

export const metadata: Metadata = {
  title: 'Usta profili',
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
