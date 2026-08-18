import type { Metadata } from 'next';

import { HashtagFeed } from '@/features/social/hashtag-feed';
import { SocialShell } from '@/features/social/social-shell';
import { t } from '@/lib/i18n';
import { applyRequestLocale } from '@/lib/server-locale';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = decodeURIComponent(slug);
  return { title: `#${tag}` };
}

export default async function HashtagPage({ params }: Props) {
  await applyRequestLocale();
  const { slug } = await params;
  const tag = decodeURIComponent(slug).replace(/^#/, '');

  return (
    <SocialShell>
      <div className="mb-3 px-0.5">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
          {t('social.trendingTitle')}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-900 dark:text-foreground">
          #{tag}
        </h1>
      </div>
      <HashtagFeed slug={tag} />
    </SocialShell>
  );
}
