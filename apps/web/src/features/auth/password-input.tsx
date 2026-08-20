'use client';

import { Input, type InputProps, cn } from '@talpio/ui';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { t } from '@/lib/i18n';

export const PasswordInput = forwardRef<HTMLInputElement, InputProps & { wrapperClassName?: string }>(
  function PasswordInput({ className, wrapperClassName, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('relative', wrapperClassName)}>
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-foreground-muted transition-colors hover:text-foreground"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
});
