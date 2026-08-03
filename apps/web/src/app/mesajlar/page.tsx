import type { Metadata } from 'next';

import { MessagesPageBody } from '@/features/messages/messages-page-body';

export const metadata: Metadata = {
  title: 'Mesajlar',
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <MessagesPageBody />
    </div>
  );
}
