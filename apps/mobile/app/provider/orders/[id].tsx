import { useLocalSearchParams } from 'expo-router';

import { OrderDetailScreen } from '@/features/orders/order-detail-screen';

export default function ProviderOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  return <OrderDetailScreen orderId={params.id ?? ''} variant="provider" />;
}
