import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-foreground-muted',
        brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-100',
        success: 'bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-500',
        warning: 'bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500',
        danger: 'bg-danger-50 text-danger-700 dark:bg-danger-700/20 dark:text-danger-500',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
