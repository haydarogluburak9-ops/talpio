import type { Metadata } from 'next';
import Link from 'next/link';

import { ChatPageBody } from '@/features/messages/messages-page-body';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('messaging.chatTitle'),
  robots: { index: false, follow: false },
};

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <SocialShell showRail={false}>
      <Link
        href="/mesajlar"
        className="mb-3 inline-flex text-sm font-medium text-accent-600 hover:underline"
      >
        ← {t('messaging.listTitle')}
      </Link>
      <ChatPageBody conversationId={id} />
    </SocialShell>
  );
}
