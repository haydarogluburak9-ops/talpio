import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { loginSchema, type LoginInput } from '@talpio/validation';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { authErrorMessage, useLogin } from '@/features/auth/use-auth-mutations';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { t } = useI18n();
  const colors = useColors();
  const login = useLogin();

  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate({ identifier: values.identifier, password: values.password });
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="displaySm">{t('auth.loginTitle')}</Text>
        <Text variant="body" tone="muted">
          {t('common.tagline')}
        </Text>
      </View>

      {login.isError && (
        <View style={[styles.banner, { backgroundColor: colors.dangerSurface }]}>
          <Text variant="caption" tone="danger">
            {authErrorMessage(login.error, t('status.networkErrorMessage'))}
          </Text>
        </View>
      )}

      <View style={styles.form}>
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <FormField
              label={t('auth.loginIdentifier')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
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
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />
          )}
        />

        <Button
          label={t('nav.login')}
          block
          loading={login.isPending}
          disabled={formState.isSubmitting}
          onPress={onSubmit}
        />
        <Link href="/(auth)/forgot-password">
          <Text variant="caption" tone="brand">
            {t('auth.forgotPassword')}
          </Text>
        </Link>
      </View>

      <View style={styles.footer}>
        <Text variant="caption" tone="muted">
          {t('auth.noAccount')}
        </Text>
        <Link href="/(auth)/register" style={{ color: colors.brand }}>
          <Text variant="bodyStrong" tone="brand">
            {t('nav.register')}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  form: { gap: spacing.lg },
  banner: { padding: spacing.md, borderRadius: radius.control },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
