'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input } from '@talpio/ui';
import { loginSchema, type LoginInput } from '@talpio/validation';
import { useForm } from 'react-hook-form';

import { ApiError } from '@/lib/api-client';
import { t } from '@/lib/i18n';

import { isStaff, useLogin, useSession } from './use-session';

export function LoginForm() {
  const login = useLogin();
  const session = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate({ identifier: values.identifier, password: values.password });
  });

  // Doğru kimlikle ama yetkisiz rolle giriş yapılmış olabilir; bunu giriş
  // hatasından ayrı anlatmak gerekir, yoksa kullanıcı şifresini sanır.
  const wrongAudience = login.isSuccess && !isStaff(session.data);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {login.isError ? (
        <p
          role="alert"
          className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface"
        >
          {login.error instanceof ApiError ? login.error.message : t('admin.loginError')}
        </p>
      ) : null}

      {wrongAudience ? (
        <p
          role="alert"
          className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface"
        >
          {t('admin.noAccess')}
        </p>
      ) : null}

      <Field label={t('auth.loginIdentifier')} required error={errors.identifier?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('identifier')}
            type="text"
            autoComplete="username"
          />
        )}
      </Field>

      <Field label={t('auth.password')} required error={errors.password?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('password')}
            type="password"
            autoComplete="current-password"
          />
        )}
      </Field>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? t('admin.signingIn') : t('admin.signIn')}
      </Button>
    </form>
  );
}
