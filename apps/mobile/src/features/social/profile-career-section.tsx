import { StyleSheet, View } from 'react-native';

import type { SocialProfile } from '@talpio/types';

import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { formatCareerPeriod } from './career-format';

export function ProfileCareerSection({
  profile,
}: {
  profile: SocialProfile;
}) {
  const { t, locale } = useI18n();
  const experiences = profile.experiences ?? [];
  const education = profile.education ?? [];

  if (experiences.length === 0 && education.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {experiences.length > 0 ? (
        <View style={styles.section}>
          <Text variant="bodyStrong">{t('social.experienceTitle')}</Text>
          {experiences.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text variant="bodyStrong">{item.title}</Text>
              <Text variant="caption">
                {[item.company, item.locationText].filter(Boolean).join(' · ')}
              </Text>
              <Text variant="caption" tone="muted">
                {formatCareerPeriod(
                  item.startYear,
                  item.startMonth,
                  item.endYear,
                  item.endMonth,
                  item.isCurrent,
                  locale,
                  t('social.present'),
                )}
              </Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={styles.section}>
          <Text variant="bodyStrong">{t('social.educationTitle')}</Text>
          {education.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text variant="bodyStrong">{item.school}</Text>
              <Text variant="caption">
                {[item.degree, item.fieldOfStudy].filter(Boolean).join(' · ')}
              </Text>
              <Text variant="caption" tone="muted">
                {formatCareerPeriod(
                  item.startYear,
                  item.startMonth,
                  item.endYear,
                  item.endMonth,
                  item.isCurrent,
                  locale,
                  t('social.present'),
                )}
              </Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg, marginTop: spacing.md },
  section: { gap: spacing.sm },
  item: { gap: 2, paddingVertical: spacing.xs },
  desc: { marginTop: spacing.xs },
});
