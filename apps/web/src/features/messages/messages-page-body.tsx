'use client';

import { LoadingState } from '@ustapilot/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { ChatThread } from './chat-thread';
import { ConversationList } from './conversation-list';

/**
 * Sohbetlerde "ben" kimin olduğu her satırda gerekir; bu yüzden sayfa gövdeleri
 * oturumu okuyan istemci bileşenleridir.
 */
export function MessagesPageBody() {
  const user = useAuthenticatedUser();
  if (!user) return <LoadingState label="Mesajlar yükleniyor" />;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t('messaging.listTitle')}</h1>
      <ConversationList currentUserId={user.id} />
    </>
  );
}

export function ChatPageBody({ conversationId }: { conversationId: string }) {
  const user = useAuthenticatedUser();
  if (!user) return <LoadingState label="Sohbet yükleniyor" />;

  return <ChatThread conversationId={conversationId} currentUserId={user.id} />;
}

/** Oturum yoksa girişe yönlendirir; yönlendirme tamamlanana kadar `null` döner. */
function useAuthenticatedUser() {
  const session = useSession();
  const router = useRouter();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  return user;
}
