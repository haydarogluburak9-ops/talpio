import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

const controlClasses =
  'w-full rounded-[--radius-control] border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger-500';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(controlClasses, 'h-10', className)} {...props} />;
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(controlClasses, 'min-h-24 resize-y', className)} {...props} />;
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return <select className={cn(controlClasses, 'h-10 pr-8', className)} {...props} />;
}

export interface FieldProps {
  label: string;
  children: (controlProps: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
  }) => ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Etiket, ipucu ve hata mesajını erişilebilir biçimde bağlar. Hata varsa
 * `aria-invalid` ve `aria-describedby` otomatik kurulur.
 */
export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-danger-500">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-foreground-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
