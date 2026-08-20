'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@talpio/api-client';
import { cn } from '@talpio/ui';
import { loginSchema, type LoginInput } from '@talpio/validation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { t } from '@/lib/i18n';

import { authInputClassName, authPrimaryButtonClassName } from './auth-form-styles';
import { PasswordInput } from './password-input';
import { useLogin } from './use-session';

export function LoginForm() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const identifier = watch('identifier');
  const password = watch('password');
  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !login.isPending;

  const onSubmit = handleSubmit((values) => {
    login.mutate({ identifier: values.identifier, password: values.password });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      {login.isError ? (
        <p
          role="alert"
          className="rounded-[10px] border border-danger-500/30 bg-danger-surface p-3 text-sm text-danger-on-surface"
        >
          {login.error instanceof ApiError ? login.error.message : t('auth.networkError')}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="login-identifier" className="sr-only">
          {t('auth.loginIdentifier')}
        </label>
        <input
          id="login-identifier"
          {...register('identifier')}
          type="text"
          autoComplete="username"
          placeholder={t('auth.loginIdentifierPlaceholder')}
          aria-invalid={errors.identifier ? true : undefined}
          className={cn(authInputClassName, errors.identifier && 'border-red-500')}
        />
        {errors.identifier ? (
          <p role="alert" className="px-1 text-xs font-medium text-danger-500">
            {errors.identifier.message}
          </p>
        ) : null}

        <label htmlFor="login-password" className="sr-only">
          {t('auth.password')}
        </label>
        <PasswordInput
          id="login-password"
          {...register('password')}
          autoComplete="current-password"
          placeholder={t('auth.password')}
          aria-invalid={errors.password ? true : undefined}
          wrapperClassName="[&_button]:text-[#8E8E8E] [&_button:hover]:text-[#262626]"
          className={cn(authInputClassName, errors.password && 'border-red-500')}
        />
        {errors.password ? (
          <p role="alert" className="px-1 text-xs font-medium text-danger-500">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={!canSubmit} className={authPrimaryButtonClassName}>
        {login.isPending ? t('auth.signingIn') : t('auth.signIn')}
      </button>

      <div className="py-1 text-center">
        <Link href="/sifremi-unuttum" className="text-xs text-[#667085] hover:underline">
          {t('auth.forgotPassword')}
        </Link>
      </div>
    </form>
  );
}
