import { useLocalSearchParams } from 'expo-router';

import { PublicProfileScreen } from '@/features/social/public-profile-screen';

export default function ProviderPublicProfileRoute() {
  const params = useLocalSearchParams<{ username: string }>();
  return <PublicProfileScreen username={params.username ?? ''} variant="provider" />;
}
