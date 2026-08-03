import { useLocalSearchParams } from 'expo-router';

import { OrderDetailScreen } from '@/features/orders/order-detail-screen';

export default function CustomerOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  return <OrderDetailScreen orderId={params.id ?? ''} variant="customer" />;
}
