import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { registerSchema, suggestUsernameFromFullName, type RegisterInput } from '@talpio/validation';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { authErrorMessage, useRegister } from '@/features/auth/use-auth-mutations';
import { useCategories } from '@/features/catalog/use-categories';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing, MIN_TOUCH_TARGET } from '@/theme/tokens';

export default function RegisterScreen() {
  const { t, locale, categoryName } = useI18n();
  const colors = useColors();
  const register = useRegister();

  const { control, handleSubmit, setValue, getValues } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      locale,
      acceptedTerms: undefined,
      acceptedMarketing: false,
      interestCategoryIds: [],
    },
  });

  const categories = useCategories();
  const acceptedTerms = useWatch({ control, name: 'acceptedTerms' }) === true;
  const interestIds = useWatch({ control, name: 'interestCategoryIds' }) ?? [];

  const onSubmit = handleSubmit((values) => {
    register.mutate({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      username: values.username,
      locale,
      interestCategoryIds: values.interestCategoryIds,
      acceptedMarketing: values.acceptedMarketing === true,
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

      <Text variant="caption" tone="muted" style={{ marginBottom: spacing.md }}>
        {t('auth.dualRoleHint')}
      </Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <FormField
              label={t('auth.fullName')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={() => {
                field.onBlur();
                if (!getValues('username')?.trim() && field.value?.trim()) {
                  setValue('username', suggestUsernameFromFullName(field.value), { shouldValidate: true });
                }
              }}
              error={fieldState.error?.message}
              autoComplete="name"
              textContentType="name"
            />
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field, fieldState }) => (
            <FormField
              label={t('auth.username')}
              value={field.value}
              onChangeText={(text) => field.onChange(text.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              hint={t('auth.usernameHint')}
              autoCapitalize="none"
              autoComplete="username"
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
          name="interestCategoryIds"
          render={({ fieldState }) => (
            <View style={styles.interests}>
              <Text variant="bodyStrong">{t('auth.interestsTitle')}</Text>
              <Text variant="caption" tone="muted">
                {t('auth.interestsHint')}
              </Text>
              {categories.isError ? (
                <Text variant="caption" tone="danger">
                  {t('auth.interestsLoadError')}
                </Text>
              ) : null}
              {categories.isPending ? (
                <Text variant="caption" tone="muted">
                  {t('common.loading')}
                </Text>
              ) : null}
              <View style={styles.chips}>
                {(categories.data ?? []).map((category) => {
                  const selected = interestIds.includes(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => {
                        const next = selected
                          ? interestIds.filter((id) => id !== category.id)
                          : [...interestIds, category.id].slice(0, 12);
                        setValue('interestCategoryIds', next, { shouldValidate: true });
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.brand : colors.surface,
                          borderColor: selected ? colors.brand : colors.border,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{ color: selected ? colors.onBrand : colors.foreground, fontWeight: '600' }}
                      >
                        {selected ? '✓ ' : ''}
                        {categoryName(category)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {fieldState.error ? (
                <Text variant="caption" tone="danger">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
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

        <Controller
          control={control}
          name="acceptedMarketing"
          render={({ field }) => (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: field.value === true }}
              onPress={() => field.onChange(!field.value)}
              style={styles.terms}
            >
              <Text variant="caption" tone="muted">
                {field.value ? '☑ ' : '☐ '}
                {t('auth.acceptMarketing')}
              </Text>
            </Pressable>
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
  interests: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
