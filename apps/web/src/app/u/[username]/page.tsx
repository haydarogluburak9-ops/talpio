import type { Metadata } from 'next';

import { publicEnv } from '@/lib/env';

import { SocialProfileView } from './profile-view';

type Props = { params: Promise<{ username: string }> };

async function fetchProfile(username: string) {
  try {
    const res = await fetch(
      `${publicEnv.apiUrl}/social/profiles/${encodeURIComponent(username)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      data?: {
        displayName?: string;
        username?: string;
        bio?: string | null;
        kind?: string;
        avatarUrl?: string | null;
      };
      displayName?: string;
      username?: string;
      bio?: string | null;
      kind?: string;
      avatarUrl?: string | null;
    };
  } catch {
    return null;
  }
}

function unwrapProfile(payload: Awaited<ReturnType<typeof fetchProfile>>) {
  if (!payload) return null;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = unwrapProfile(await fetchProfile(username));
  const name = profile?.displayName ?? username;
  const isStore = profile?.kind === 'BUSINESS';
  const title = isStore ? `${name} | Talpio Mağaza` : `${name} | Talpio`;
  const description =
    profile?.bio?.trim() ||
    (isStore
      ? `${name} mağaza vitrini — fırsatlar, kampanyalar ve ürün paylaşımları.`
      : `${name} sosyal profili.`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${publicEnv.siteUrl}/u/${username}`,
      type: 'profile',
      ...(profile?.avatarUrl ? { images: [{ url: profile.avatarUrl }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(profile?.avatarUrl ? { images: [profile.avatarUrl] } : {}),
    },
  };
}

export default async function SocialProfilePage() {
  return <SocialProfileView />;
}
