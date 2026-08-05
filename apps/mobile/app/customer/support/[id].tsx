import { useLocalSearchParams } from 'expo-router';

import { TicketDetailScreen } from '@/features/support/ticket-detail-screen';

export default function CustomerSupportTicketScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  return <TicketDetailScreen ticketId={params.id ?? ''} />;
}
