'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, EmptyState } from '@talpio/ui';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

export function EmploymentClaimsPanel({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const claims = useQuery({
    queryKey: ['businesses', businessId, 'employment-claims'],
    queryFn: ({ signal }) => apiClient.businesses.listEmploymentClaims(businessId, signal),
  });

  const decide = useMutation({
    mutationFn: (input: { userId: string; approve: boolean }) =>
      apiClient.businesses.decideEmployment(businessId, input.userId, input.approve),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['businesses', businessId, 'employment-claims'],
      });
    },
  });

  const items = claims.data ?? [];

  return (
    <section className="social-panel flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-semibold">{t('verification.claimsTitle')}</h2>
        <p className="mt-1 text-sm text-foreground-muted">{t('verification.claimsHint')}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title={t('verification.noClaims')} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((claim) => (
            <li
              key={claim.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{claim.user.fullName}</p>
                <p className="truncate text-xs text-foreground-muted">{claim.user.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ userId: claim.user.id, approve: true })}
                >
                  {t('verification.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ userId: claim.user.id, approve: false })}
                >
                  {t('verification.reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
