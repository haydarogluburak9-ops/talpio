'use client';

import { cn } from '@talpio/ui';
import {
  BadgePercent,
  Compass,
  Home,
  MessageCircle,
  Plus,
  Store,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { SuggestedBusinesses } from './suggested-businesses';
import { TrendingRail } from './trending-rail';
import { useSocialMe } from './use-social';

export function SocialShell({
  children,
  showRail = true,
}: {
  children: React.ReactNode;
  showRail?: boolean;
}) {
  const pathname = usePathname();
  const session = useSession();
  const me = useSocialMe(Boolean(session.data));
  const profileHref = me.data?.username ? `/u/${me.data.username}` : '/hesabim';
  const profileActive =
    pathname === profileHref ||
    pathname.startsWith('/hesabim') ||
    pathname.startsWith('/profil') ||
    Boolean(me.data?.username && pathname === `/u/${me.data.username}`);

  return (
    <div className="social-app relative min-h-[calc(100svh-4.25rem)]">
      <div className={cn('w-full px-3 py-4 lg:px-5', showRail && 'xl:pr-5')}>
        <div
          className={cn(
            'mx-auto grid w-full gap-4',
            showRail ? 'max-w-[1160px] xl:grid-cols-[minmax(0,1fr)_300px]' : 'max-w-[920px]',
          )}
        >
          <section className="min-w-0 pb-24">{children}</section>

          {showRail ? (
            <aside className="hidden xl:block">
              <div className="sticky top-[5.25rem] space-y-3">
                <div className="social-panel overflow-hidden p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-accent-500/15 text-accent-600">
                      <BadgePercent className="size-4" aria-hidden />
                    </span>
                    <p className="text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
                      {t('social.railDealsTitle')}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground-muted">
                    {t('social.railDealsBody')}
                  </p>
                  <Link
                    href="/kesfet"
                    className="mt-4 inline-flex text-sm font-semibold text-accent-600 hover:text-accent-700"
                  >
                    {t('nav.discover')} →
                  </Link>
                </div>
                <div className="social-panel p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-info-50 text-info-600">
                      <Compass className="size-4" aria-hidden />
                    </span>
                    <p className="text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
                      {t('social.railNearbyTitle')}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    {t('social.railNearbyBody')}
                  </p>
                  <Link
                    href="/tedarik"
                    className="mt-4 inline-flex text-sm font-semibold text-accent-600 hover:text-accent-700"
                  >
                    {t('nav.newRequest')} →
                  </Link>
                </div>
                <div className="social-panel p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
                      <Store className="size-4" aria-hidden />
                    </span>
                    <p className="text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
                      {t('social.railBusinessTitle')}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    {t('social.railBusinessBody')}
                  </p>
                </div>
                <SuggestedBusinesses compact />
                <TrendingRail />
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      <nav
        aria-label={t('nav.mainMenu')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-white/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl dark:bg-[#0D1B2A]/95"
      >
        <ul className="mx-auto flex max-w-lg items-end justify-around">
          {(
            [
              { href: '/akis', labelKey: 'nav.feed' as const, icon: Home, tone: 'text-accent-500' },
              { href: '/kesfet', labelKey: 'nav.discover' as const, icon: Compass, tone: 'text-info-500' },
              { href: '/tedarik', labelKey: 'nav.newRequest' as const, icon: Plus, cta: true, tone: 'text-accent-600' },
              { href: '/mesajlar', labelKey: 'nav.messages' as const, icon: MessageCircle, tone: 'text-violet-500' },
              { href: profileHref, labelKey: 'nav.profile' as const, icon: UserRound, tone: 'text-teal-600', profile: true },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isCta = 'cta' in item && item.cta;
            const active =
              'profile' in item && item.profile
                ? profileActive
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium',
                    isCta
                      ? '-mt-4 text-accent-600'
                      : active
                        ? `font-semibold ${item.tone}`
                        : 'text-foreground-muted',
                  )}
                >
                  {isCta ? (
                    <span className="grid size-12 place-items-center rounded-2xl bg-accent-500 text-white shadow-[0_8px_20px_rgb(255_106_0_/_0.35)]">
                      <Icon className="size-6" aria-hidden />
                    </span>
                  ) : (
                    <Icon className={cn('size-5', active && item.tone)} aria-hidden />
                  )}
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
