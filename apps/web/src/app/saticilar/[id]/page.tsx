import type { Metadata } from 'next';

import { ProviderProfileBody } from '@/features/reviews/provider-profile-body';
import { generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('provider.profileTitle');
}

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
