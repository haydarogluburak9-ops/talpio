import type { Metadata } from 'next';

import { MessagesPageBody } from '@/features/messages/messages-page-body';
import { SocialShell } from '@/features/social/social-shell';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('nav.messages', { robots: { index: false, follow: false } });
}

export default async function MessagesPage() {
  await applyRequestLocale();
  return (
    <SocialShell showRail={false}>
      <MessagesPageBody />
    </SocialShell>
  );
}
