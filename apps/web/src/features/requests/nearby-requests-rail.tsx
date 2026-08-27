'use client';

import { cn } from '@talpio/ui';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { useNearbyRequests } from './use-requests';

/**
 * Kullanıcının şehrindeki açık talepler.
 *
 * Şehri belirlenemeyen kullanıcıda uç boş liste döner; kutu tamamen gizlenir
 * çünkü "yakında talep yok" mesajı, konumu olmayan kullanıcıyı yanıltır.
 */
export function NearbyRequestsRail({ compact = false }: { compact?: boolean }) {
  const session = useSession();
  const nearby = useNearbyRequests(5, Boolean(session.data));

  if (!session.data) return null;
  if (nearby.isPending) return null;

  const items = nearby.data ?? [];
  if (items.length === 0) return null;

  return (
    <div className={cn('social-panel', compact ? 'px-4 py-3' : 'p-5')}>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-success-500/15 text-success-700 dark:text-success-500">
          <MapPin className="size-4" aria-hidden />
        </span>
        <p className="text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('commerce.nearbyTitle')}
        </p>
      </div>

      <ul className="space-y-1.5">
        {items.map((request) => (
          <li key={request.id}>
            <Link
              href={`/tedarik/${request.id}#teklif-ver`}
              className="block rounded-lg px-1 py-1.5 hover:bg-surface-muted"
            >
              <p className="truncate text-sm font-semibold text-foreground">{request.title}</p>
              <p className="mt-0.5 truncate text-xs text-foreground-muted">
                {[request.quantity ? `${request.quantity} ${request.unit ?? ''}`.trim() : null]
                  .filter(Boolean)
                  .join(' · ') || t('commerce.nearbyOpen')}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/satici/tedarik"
        className="mt-3 inline-flex text-sm font-semibold text-accent-600 hover:text-accent-700"
      >
        {t('commerce.nearbyAll')} →
      </Link>
    </div>
  );
}
