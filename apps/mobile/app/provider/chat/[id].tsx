import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@/features/messages/chat-screen';

export default function ProviderChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  return <ChatScreen conversationId={params.id ?? ''} />;
}
