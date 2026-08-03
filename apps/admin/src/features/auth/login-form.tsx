'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input } from '@ustapilot/ui';
import { loginSchema, type LoginInput } from '@ustapilot/validation';
import { useForm } from 'react-hook-form';

import { ApiError } from '@/lib/api-client';

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
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate({ email: values.email, password: values.password });
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
          {login.error instanceof ApiError
            ? login.error.message
            : 'Sunucuya ulaşılamadı. API çalışıyor mu?'}
        </p>
      ) : null}

      {wrongAudience ? (
        <p
          role="alert"
          className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface"
        >
          Bu hesabın yönetim paneline erişim yetkisi yok.
        </p>
      ) : null}

      <Field label="E-posta" required error={errors.email?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="admin@ustapilot.com"
          />
        )}
      </Field>

      <Field label="Şifre" required error={errors.password?.message}>
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
        {login.isPending ? 'Giriş yapılıyor…' : 'Giriş yap'}
      </Button>
    </form>
  );
}
