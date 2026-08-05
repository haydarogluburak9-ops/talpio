'use client';

import { SUPPORT_TICKET_STATUS_TONES } from '@ustapilot/config';
import { formatRelativeTime, supportTicketStatusLabel } from '@ustapilot/localization';
import type { SupportTicket } from '@ustapilot/types';
import {
  buttonVariants,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  ListSkeleton,
  StatusPill,
} from '@ustapilot/ui';
import Link from 'next/link';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { useSupportTickets } from './use-support';

export function TicketList() {
  const tickets = useSupportTickets({ limit: 50 });

  if (tickets.isPending) return <ListSkeleton rows={3} />;

  if (tickets.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description={t('support.loadFailed')}
        action={{ label: t('common.retry'), onClick: () => void tickets.refetch() }}
      />
    );
  }

  if (tickets.data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <EmptyState
          title={t('support.empty')}
          description={t('support.emptyDescription')}
          className="w-full"
        />
        <Link href="/destek/yeni" className={buttonVariants()}>
          {t('support.createCta')}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {tickets.data.items.map((ticket) => (
        <li key={ticket.id}>
          <TicketRow ticket={ticket} />
        </li>
      ))}
    </ul>
  );
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const locale = publicEnv.defaultLocale;

  return (
    <Link href={`/destek/${ticket.id}`} className="block rounded-[--radius-card]">
      <Card className="transition-colors hover:bg-surface-muted">
        <CardContent className="flex flex-col gap-3 pt-5 sm:pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="min-w-0 truncate font-medium text-foreground">{ticket.subject}</p>
            <StatusPill
              label={supportTicketStatusLabel(ticket.status, locale)}
              tone={SUPPORT_TICKET_STATUS_TONES[ticket.status]}
            />
          </div>
          <p className="text-xs text-foreground-muted">
            {formatRelativeTime(ticket.lastMessageAt ?? ticket.createdAt, locale)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function SupportListHeader() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{t('support.listTitle')}</h1>
      <Link href="/destek/yeni" className={buttonVariants()}>
        {t('support.createCta')}
      </Link>
    </div>
  );
}
