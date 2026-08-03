import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[--radius-control] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        accent: 'bg-accent-500 text-brand-950 hover:bg-accent-600',
        outline: 'border border-border bg-surface hover:bg-surface-muted',
        ghost: 'hover:bg-surface-muted',
        danger: 'bg-danger-500 text-white hover:bg-danger-700',
        link: 'text-brand-600 underline-offset-4 hover:underline dark:text-brand-300',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  block,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled === true || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
