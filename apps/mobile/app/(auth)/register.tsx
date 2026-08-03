import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { UserRole } from '@ustapilot/types';
import { registerSchema, type RegisterInput } from '@ustapilot/validation';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { authErrorMessage, useRegister } from '@/features/auth/use-auth-mutations';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/theme/tokens';

type RegisterableRole = typeof UserRole.CUSTOMER | typeof UserRole.PROVIDER;

export default function RegisterScreen() {
  const { t, locale } = useI18n();
  const colors = useColors();
  const register = useRegister();

  const { control, handleSubmit, setValue } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      role: UserRole.CUSTOMER,
      locale,
      acceptedTerms: undefined,
    },
  });

  const role = useWatch({ control, name: 'role' }) as RegisterableRole;
  const acceptedTerms = useWatch({ control, name: 'acceptedTerms' }) === true;

  const onSubmit = handleSubmit((values) => {
    register.mutate({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      role: values.role,
      locale,
      ...(values.phone ? { phone: values.phone } : {}),
    });
  });

  return (
    <Screen>
      <Text variant="displaySm">{t('auth.registerTitle')}</Text>

      {register.isError && (
        <View style={[styles.banner, { backgroundColor: colors.dangerSurface }]}>
          <Text variant="caption" tone="danger">
            {authErrorMessage(register.error, t('status.networkErrorMessage'))}
          </Text>
        </View>
      )}

      <View style={styles.roleRow}>
        {(
          [
            { value: UserRole.CUSTOMER, label: t('auth.roleCustomer') },
            { value: UserRole.PROVIDER, label: t('auth.roleProvider') },
          ] as const
        ).map((option) => {
          const selected = role === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setValue('role', option.value, { shouldValidate: true })}
              style={[
                styles.roleCard,
                {
                  backgroundColor: selected ? colors.brand : colors.surface,
                  borderColor: selected ? colors.brand : colors.border,
                },
              ]}
            >
              <Text variant="bodyStrong" style={{ color: selected ? colors.onBrand : colors.foreground }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <FormField
              label={t('auth.fullName')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoComplete="name"
              textContentType="name"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField
              label={t('auth.email')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormField
              label={`${t('auth.phone')} (${t('common.optional')})`}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              hint="+905321234567"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField
              label={t('auth.password')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        />

        <Controller
          control={control}
          name="passwordConfirmation"
          render={({ field, fieldState }) => (
            <FormField
              label={t('auth.passwordConfirmation')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        />

        <Controller
          control={control}
          name="acceptedTerms"
          render={({ fieldState }) => (
            <View style={styles.terms}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                accessibilityLabel={t('auth.acceptTerms')}
                // Şema `true` sabitini bekler; kaldırıldığında alan hiç
                // gönderilmemiş sayılsın diye `undefined` yazılır.
                onPress={() =>
                  setValue('acceptedTerms', acceptedTerms ? (undefined as never) : true, {
                    shouldValidate: true,
                  })
                }
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: acceptedTerms ? colors.brand : 'transparent',
                    borderColor: acceptedTerms ? colors.brand : colors.border,
                  },
                ]}
              >
                {acceptedTerms ? (
                  <Text variant="caption" style={{ color: colors.onBrand }}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>

              <View style={styles.termsText}>
                <Text variant="caption" tone="muted">
                  {t('auth.acceptTerms')}
                </Text>
                {fieldState.error ? (
                  <Text variant="caption" tone="danger">
                    {fieldState.error.message}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        />

        <Button
          label={t('nav.register')}
          block
          loading={register.isPending}
          onPress={onSubmit}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="caption" tone="muted">
          {t('auth.alreadyHaveAccount')}
        </Text>
        <Link href="/(auth)/login">
          <Text variant="bodyStrong" tone="brand">
            {t('nav.login')}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  banner: { padding: spacing.md, borderRadius: radius.control },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET + 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.control,
  },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: { flex: 1, gap: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
