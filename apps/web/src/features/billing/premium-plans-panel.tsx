'use client';

import { ListSkeleton } from '@talpio/ui';
import { Sparkles } from 'lucide-react';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { useBillingPlans } from './use-billing';

export function PremiumPlansPanel() {
  const plans = useBillingPlans(publicEnv.featurePremium);

  if (!publicEnv.featurePremium) return null;

  return (
    <section className="social-panel overflow-hidden">
      <div className="border-b border-border/70 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent-500 text-white">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
              {t('billing.plansTitle')}
            </h2>
            <p className="mt-0.5 text-sm text-foreground-muted">{t('billing.plansHint')}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {plans.isPending ? <ListSkeleton rows={2} /> : null}
        {!plans.isPending && (plans.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-foreground-muted">{t('billing.plansEmpty')}</p>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2">
          {(plans.data ?? []).map((plan) => (
            <li
              key={plan.id}
              className="rounded-2xl bg-surface-muted/50 px-4 py-4 ring-1 ring-border/70"
            >
              <p className="font-display text-base font-semibold text-brand-900 dark:text-foreground">
                {plan.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-accent-600">
                {t('billing.creditsPerMonth', { count: plan.monthlyCredits })}
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                {plan.code}
                {!plan.isActive ? ` · ${t('billing.planInactive')}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
