import { useLocalSearchParams } from 'expo-router';

import { CommerceRequestFormScreen } from '@/features/requests/commerce-request-form-screen';

export default function NewCommerceRequestScreen() {
  const params = useLocalSearchParams<{ storeUsername?: string }>();
  return <CommerceRequestFormScreen storeUsername={params.storeUsername?.trim() || undefined} />;
}
