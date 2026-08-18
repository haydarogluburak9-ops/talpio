'use client';

import { LoadingState } from '@talpio/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { ChatThread } from './chat-thread';
import { ConversationList } from './conversation-list';
import { NewGroupForm } from './new-group-form';

/**
 * Sohbetlerde "ben" kimin olduğu her satırda gerekir; bu yüzden sayfa gövdeleri
 * oturumu okuyan istemci bileşenleridir.
 */
export function MessagesPageBody() {
  const user = useAuthenticatedUser();
  if (!user) return <LoadingState label="Mesajlar yükleniyor" />;

  return (
    <div className="flex flex-col gap-3 pb-20 lg:pb-6">
      <div className="social-panel p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('messaging.listTitle')}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('messaging.emptyDescription')}</p>
      </div>
      <NewGroupForm />
      <ConversationList currentUserId={user.id} />
    </div>
  );
}

export function ChatPageBody({ conversationId }: { conversationId: string }) {
  const user = useAuthenticatedUser();
  if (!user) return <LoadingState label="Sohbet yükleniyor" />;

  return (
    <div className="grid gap-3 pb-20 lg:grid-cols-[280px_minmax(0,1fr)] lg:pb-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <ConversationList currentUserId={user.id} />
      </div>
      <ChatThread conversationId={conversationId} currentUserId={user.id} />
    </div>
  );
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
