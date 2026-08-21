import type { Metadata } from 'next';

import { ChatPageBody } from '@/features/messages/messages-page-body';
import { SocialShell } from '@/features/social/social-shell';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('messaging.chatTitle', { robots: { index: false, follow: false } });
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  await applyRequestLocale();
  const { id } = await params;

  return (
    <SocialShell showRail={false}>
      <ChatPageBody conversationId={id} />
    </SocialShell>
  );
}
