'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@ustapilot/api-client';
import { Button, Field, Input } from '@ustapilot/ui';
import { loginSchema, type LoginInput } from '@ustapilot/validation';
import { useForm } from 'react-hook-form';

import { useLogin } from './use-session';

export function LoginForm() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate({ email: values.email, password: values.password });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {login.isError ? (
        <p role="alert" className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface">
          {login.error instanceof ApiError
            ? login.error.message
            : 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.'}
        </p>
      ) : null}

      <Field label="E-posta" required error={errors.email?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="ornek@ustapilot.com"
          />
        )}
      </Field>

      <Field label="Şifre" required error={errors.password?.message}>
        {(props) => <Input {...props} {...register('password')} type="password" autoComplete="current-password" />}
      </Field>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Giriş yapılıyor…' : 'Giriş yap'}
      </Button>
    </form>
  );
}
