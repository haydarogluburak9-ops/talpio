import { useLocalSearchParams } from 'expo-router';

import { ProviderReviewsScreen } from '@/features/reviews/provider-reviews-screen';

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  return <ProviderReviewsScreen providerId={params.id ?? ''} />;
}
