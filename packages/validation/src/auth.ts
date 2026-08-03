import { UserRole } from '@ustapilot/types';
import { z } from 'zod';

import {
  emailSchema,
  fullNameSchema,
  optionalPhoneSchema,
  otpSchema,
  passwordSchema,
  phoneSchema,
} from './primitives';

/** Kayıt sırasında yalnızca müşteri ve usta rolleri seçilebilir. */
export const registerableRoleSchema = z.enum([UserRole.CUSTOMER, UserRole.PROVIDER]);

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
    role: registerableRoleSchema,
    locale: z.string().min(2).max(5).default('tr'),
    acceptedTerms: z.literal(true, { message: 'Kullanım koşullarını kabul etmelisiniz' }),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Şifreler eşleşmiyor',
  });

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterPayload = z.output<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Şifre zorunludur'),
  /** Cihaz bazlı oturum yönetimi için istemcinin ürettiği kalıcı kimlik. */
  deviceId: z.string().trim().max(128).optional(),
});

export type LoginInput = z.input<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const requestPhoneCodeSchema = z.object({
  phone: phoneSchema,
});

export const verifyPhoneSchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(16, 'Geçersiz doğrulama bağlantısı'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(16, 'Geçersiz sıfırlama bağlantısı'),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Şifreler eşleşmiyor',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre zorunludur'),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Şifreler eşleşmiyor',
  })
  .refine((value) => value.currentPassword !== value.password, {
    path: ['password'],
    message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
  });
