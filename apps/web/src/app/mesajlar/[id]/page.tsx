import type { Metadata } from 'next';
import Link from 'next/link';

import { ChatPageBody } from '@/features/messages/messages-page-body';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('messaging.chatTitle', { robots: { index: false, follow: false } });
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  await applyRequestLocale();
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
