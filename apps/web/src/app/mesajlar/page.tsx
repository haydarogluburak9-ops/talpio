import type { Metadata } from 'next';

import { MessagesPageBody } from '@/features/messages/messages-page-body';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('nav.messages'),
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return (
    <SocialShell showRail={false}>
      <MessagesPageBody />
    </SocialShell>
  );
}
