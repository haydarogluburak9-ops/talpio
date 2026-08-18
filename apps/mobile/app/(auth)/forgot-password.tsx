import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setPending(true);
    try {
      await apiClient.auth.forgotPassword(email);
      setDone(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Text variant="displaySm">{t('auth.forgotPassword')}</Text>
      {done ? (
        <Text variant="body" tone="muted">
          {t('auth.forgotSent')}
        </Text>
      ) : (
        <View style={styles.form}>
          <FormField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Button label={t('auth.forgotPassword')} block loading={pending} onPress={() => void submit()} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, marginTop: spacing.lg },
});
