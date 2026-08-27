'use client';

import { LoadingState } from '@talpio/ui';
import { MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { ChatThread } from './chat-thread';
import { ConversationList } from './conversation-list';
import { NewConversationPanel } from './new-conversation-panel';

export function MessagesPageBody() {
  const user = useAuthenticatedUser();
  const [composeOpen, setComposeOpen] = useState(false);

  if (!user) return <LoadingState label={t('messaging.listLoading')} />;

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col overflow-hidden pb-16 lg:pb-0">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:rounded-xl lg:border lg:border-border/70 lg:bg-surface lg:shadow-sm">
        <aside className="flex min-h-0 flex-col border-border/70 lg:border-r">
          <MessagesInboxHeader onCompose={() => setComposeOpen((value) => !value)} />
          {composeOpen ? (
            <div className="border-b border-border/70 px-4 py-3">
              <NewConversationPanel onClose={() => setComposeOpen(false)} />
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList currentUserId={user.id} compact />
          </div>
        </aside>

        <div className="hidden min-h-0 flex-col items-center justify-center gap-3 px-8 text-center lg:flex">
          <div className="grid size-24 place-items-center rounded-full border border-border">
            <MessageSquarePlus className="size-10 text-foreground-muted" aria-hidden />
          </div>
          <p className="max-w-xs text-sm text-foreground-muted">{t('messaging.selectConversation')}</p>
        </div>
      </div>
    </div>
  );
}

export function ChatPageBody({ conversationId }: { conversationId: string }) {
  const user = useAuthenticatedUser();
  if (!user) return <LoadingState label={t('messaging.chatLoading')} />;

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col overflow-hidden pb-16 lg:pb-0">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:rounded-xl lg:border lg:border-border/70 lg:bg-surface lg:shadow-sm">
        <aside className="hidden min-h-0 flex-col border-border/70 lg:flex lg:border-r">
          <MessagesInboxHeader />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList currentUserId={user.id} compact />
          </div>
        </aside>
        <div className="min-h-0 flex-1">
          <ChatThread conversationId={conversationId} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}

function MessagesInboxHeader({ onCompose }: { onCompose?: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3.5">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('messaging.listTitle')}</h1>
      {onCompose ? (
        <button
          type="button"
          onClick={onCompose}
          className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface-muted"
          aria-label={t('messaging.newMessage')}
          title={t('messaging.newMessage')}
        >
          <MessageSquarePlus className="size-6" aria-hidden />
        </button>
      ) : (
        <Link
          href="/mesajlar"
          className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface-muted lg:hidden"
          aria-label={t('messaging.listTitle')}
        >
          <MessageSquarePlus className="size-6" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function useAuthenticatedUser() {
  const session = useSession();
  const router = useRouter();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  return user;
}
