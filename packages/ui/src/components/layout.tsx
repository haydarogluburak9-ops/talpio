import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'narrow' | 'default' | 'wide';
}

const sizeClasses = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-[90rem]',
} as const;

/** Sayfa içeriğini ortalar ve her kırılma noktasında güvenli kenar boşluğu bırakır. */
export function Container({ className, size = 'default', ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[size], className)} {...props} />
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
}

export function Section({ className, title, description, children, ...props }: SectionProps) {
  return (
    <section className={cn('py-8 sm:py-12', className)} {...props}>
      {title ? (
        <div className="mb-5 flex flex-col gap-1 sm:mb-6">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {description ? (
            <p className="text-sm text-foreground-muted text-balance-safe">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
