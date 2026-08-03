import { buttonVariants } from '@ustapilot/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ChatPageBody } from '@/features/messages/messages-page-body';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Sohbet',
  robots: { index: false, follow: false },
};

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/mesajlar"
        className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mb-4`}
      >
        ← {t('messaging.listTitle')}
      </Link>

      <ChatPageBody conversationId={id} />
    </div>
  );
}
