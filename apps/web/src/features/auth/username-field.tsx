'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { cn, Field, Input } from '@talpio/ui';
import { usernameSchema } from '@talpio/validation';
import { Check, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

export function UsernameField({
  value,
  onChange,
  onBlur,
  error,
  compact = false,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  compact?: boolean;
  inputClassName?: string;
}) {
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim().toLowerCase()), 400);
    return () => window.clearTimeout(timer);
  }, [value]);

  const parsed = useMemo(() => usernameSchema.safeParse(debounced), [debounced]);
  const canCheck = parsed.success;

  const availability = useQuery({
    queryKey: queryKeys.social.usernameAvailability(debounced),
    queryFn: ({ signal }) => apiClient.social.checkUsernameAvailability(debounced, signal),
    enabled: canCheck,
    staleTime: 30_000,
    retry: false,
  });

  const showTaken = canCheck && availability.data && !availability.data.available;
  const showAvailable = canCheck && availability.data?.available;

  return (
    <Field
      label={t('auth.username')}
      required
      hint={compact ? undefined : t('auth.usernameHint')}
      error={error ?? (showTaken ? t('auth.usernameTaken') : undefined)}
      className={compact ? 'gap-1' : undefined}
    >
      {(props) => (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#667085]">
            @
          </span>
          <Input
            {...props}
            value={value}
            onChange={(event) => {
              onChange(event.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''));
            }}
            onBlur={onBlur}
            autoComplete="username"
            spellCheck={false}
            aria-invalid={Boolean(error || showTaken) || undefined}
            className={cn(
              inputClassName ??
                (compact
                  ? 'h-9 rounded-lg border-[#DBDBDB] bg-white py-2 pl-7 pr-9 text-sm text-[#111827] shadow-none'
                  : 'h-12 rounded-xl border-border/70 bg-white py-2 pl-8 pr-10 text-[15px] text-[#111827] shadow-soft'),
              'transition-[border-color,box-shadow] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/50',
              showTaken && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
              showAvailable && 'border-success-500 focus:border-success-500 focus:ring-success-500/20',
            )}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {canCheck && availability.isFetching ? (
              <Loader2 className="size-4 animate-spin text-foreground-muted" aria-hidden />
            ) : null}
            {showAvailable ? <Check className="size-4 text-success-500" aria-hidden /> : null}
            {showTaken ? <X className="size-4 text-danger-500" aria-hidden /> : null}
          </span>
          {showAvailable && !compact ? (
            <p className="mt-1.5 text-xs font-medium text-success-700">{t('auth.usernameAvailable')}</p>
          ) : null}
          {canCheck && availability.isFetching && !compact ? (
            <p className="mt-1.5 text-xs text-foreground-muted">{t('auth.usernameChecking')}</p>
          ) : null}
        </div>
      )}
    </Field>
  );
}
