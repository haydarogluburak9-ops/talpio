import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-foreground-muted',
        brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-100',
        accent: 'bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
        success: 'bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-500',
        warning: 'bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500',
        danger: 'bg-danger-50 text-danger-700 dark:bg-danger-700/20 dark:text-danger-500',
        info: 'bg-info-50 text-info-700 dark:bg-info-700/20 dark:text-info-500',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
