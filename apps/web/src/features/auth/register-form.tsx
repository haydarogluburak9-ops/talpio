'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@ustapilot/api-client';
import { UserRole } from '@ustapilot/types';
import { Button, Field, Input } from '@ustapilot/ui';
import { registerSchema, type RegisterInput } from '@ustapilot/validation';
import { useForm, useWatch } from 'react-hook-form';

import { useRegister } from './use-session';

const ROLE_OPTIONS = [
  { value: UserRole.CUSTOMER, label: 'Hizmet almak istiyorum' },
  { value: UserRole.PROVIDER, label: 'Usta olarak çalışmak istiyorum' },
] as const;

export function RegisterForm({ defaultRole = UserRole.CUSTOMER }: { defaultRole?: UserRole }) {
  const signUp = useRegister();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
      role: defaultRole === UserRole.PROVIDER ? UserRole.PROVIDER : UserRole.CUSTOMER,
      locale: 'tr',
    },
  });

  const selectedRole = useWatch({ control, name: 'role' });

  const onSubmit = handleSubmit((values) => {
    signUp.mutate({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      role: values.role,
      locale: 'tr',
      // Boş bırakılan telefon alanı hiç gönderilmez; "" doğrulamadan geçmez.
      ...(values.phone ? { phone: values.phone } : {}),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {signUp.isError ? (
        <p role="alert" className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface">
          {signUp.error instanceof ApiError
            ? signUp.error.message
            : 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.'}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Hesap türü</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-[--radius-control] border p-3 text-sm ${
                selectedRole === option.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-border text-foreground'
              }`}
            >
              <input type="radio" value={option.value} {...register('role')} className="size-4" />
              {option.label}
            </label>
          ))}
        </div>
        {errors.role ? (
          <p role="alert" className="text-xs font-medium text-danger-500">
            {errors.role.message}
          </p>
        ) : null}
      </fieldset>

      <Field label="Ad soyad" required error={errors.fullName?.message}>
        {(props) => <Input {...props} {...register('fullName')} autoComplete="name" />}
      </Field>

      <Field label="E-posta" required error={errors.email?.message}>
        {(props) => <Input {...props} {...register('email')} type="email" autoComplete="email" />}
      </Field>

      <Field
        label="Telefon"
        hint="İsteğe bağlı. +905321234567 biçiminde girin."
        error={errors.phone?.message}
      >
        {(props) => (
          <Input {...props} {...register('phone')} type="tel" autoComplete="tel" placeholder="+905321234567" />
        )}
      </Field>

      <Field
        label="Şifre"
        required
        hint="En az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam."
        error={errors.password?.message}
      >
        {(props) => <Input {...props} {...register('password')} type="password" autoComplete="new-password" />}
      </Field>

      <Field label="Şifre tekrar" required error={errors.passwordConfirmation?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('passwordConfirmation')}
            type="password"
            autoComplete="new-password"
          />
        )}
      </Field>

      <Field label="" error={errors.acceptedTerms?.message}>
        {(props) => (
          <label className="flex items-start gap-2 text-sm text-foreground-muted">
            <input
              {...props}
              {...register('acceptedTerms')}
              type="checkbox"
              className="mt-0.5 size-4 shrink-0"
            />
            Kullanım koşullarını ve gizlilik politikasını okudum, kabul ediyorum.
          </label>
        )}
      </Field>

      <Button type="submit" className="w-full" disabled={signUp.isPending}>
        {signUp.isPending ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
      </Button>
    </form>
  );
}
