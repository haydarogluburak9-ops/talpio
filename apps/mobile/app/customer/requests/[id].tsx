import { useLocalSearchParams } from 'expo-router';

import { CommerceRequestDetailScreen } from '@/features/requests/commerce-request-detail-screen';

export default function CommerceRequestDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <CommerceRequestDetailScreen id={params.id ?? ''} />;
}
