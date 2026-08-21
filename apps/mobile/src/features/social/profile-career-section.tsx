import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { SocialProfile } from '@talpio/types';
import { SocialProfileKind } from '@talpio/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { formatCareerPeriod } from './career-format';
import { useCreateSkill, useDeleteSkill, useUpdateSocialProfile } from './use-social';

export function ProfileSidebar({
  profile,
  isOwn = false,
}: {
  profile: SocialProfile;
  isOwn?: boolean;
}) {
  if (profile.kind !== SocialProfileKind.PERSONAL) return null;

  const experiences = profile.experiences ?? [];
  const education = profile.education ?? [];
  const skills = profile.skills ?? [];
  const hasBio = Boolean(profile.bio?.trim());
  const hasContent =
    hasBio || experiences.length > 0 || education.length > 0 || skills.length > 0;

  if (!isOwn && !hasContent) return null;

  return (
    <View style={styles.wrap}>
      <AboutCard profile={profile} isOwn={isOwn} />
      <ExperienceCard items={experiences} />
      <EducationCard items={education} />
      <SkillsCard profile={profile} items={skills} isOwn={isOwn} />
    </View>
  );
}

/** @deprecated Use ProfileSidebar */
export const ProfileCareerSection = ProfileSidebar;

function SidebarCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text variant="bodyStrong">{title}</Text>
        {action}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </Card>
  );
}

function AboutCard({ profile, isOwn }: { profile: SocialProfile; isOwn: boolean }) {
  const { t } = useI18n();
  const colors = useColors();
  const update = useUpdateSocialProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile.bio ?? '');

  if (!isOwn && !profile.bio?.trim()) return null;

  return (
    <SidebarCard
      title={t('social.aboutTab')}
      action={
        isOwn ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setValue(profile.bio ?? '');
              setEditing((open) => !open);
            }}
            hitSlop={8}
          >
            <Text variant="caption" style={{ color: colors.accent }}>
              {editing ? t('common.cancel') : t('common.edit')}
            </Text>
          </Pressable>
        ) : null
      }
    >
      {editing ? (
        <View style={styles.editBlock}>
          <TextInput
            value={value}
            onChangeText={setValue}
            multiline
            placeholder={t('social.personalAboutEmpty')}
            placeholderTextColor={colors.foregroundMuted}
            style={[styles.textArea, { color: colors.foreground, borderColor: colors.border }]}
          />
          <Button
            label={t('common.save')}
            loading={update.isPending}
            onPress={() =>
              update.mutate({ bio: value.trim() || null }, { onSuccess: () => setEditing(false) })
            }
          />
        </View>
      ) : profile.bio?.trim() ? (
        <Text>{profile.bio}</Text>
      ) : (
        <Text tone="muted">{t('social.personalAboutEmpty')}</Text>
      )}
    </SidebarCard>
  );
}

function ExperienceCard({ items }: { items: NonNullable<SocialProfile['experiences']> }) {
  const { t, locale } = useI18n();

  if (items.length === 0) return null;

  return (
    <SidebarCard title={t('social.experienceTitle')}>
      {items.map((item, index) => (
        <View key={item.id} style={[styles.careerItem, index > 0 && styles.careerDivider]}>
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
    </SidebarCard>
  );
}

function EducationCard({ items }: { items: NonNullable<SocialProfile['education']> }) {
  const { t, locale } = useI18n();

  if (items.length === 0) return null;

  return (
    <SidebarCard title={t('social.educationTitle')}>
      {items.map((item, index) => (
        <View key={item.id} style={[styles.careerItem, index > 0 && styles.careerDivider]}>
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
    </SidebarCard>
  );
}

function SkillsCard({
  profile,
  items,
  isOwn,
}: {
  profile: SocialProfile;
  items: NonNullable<SocialProfile['skills']>;
  isOwn: boolean;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const create = useCreateSkill(profile.username);
  const remove = useDeleteSkill(profile.username);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  if (!isOwn && items.length === 0) return null;

  return (
    <SidebarCard
      title={t('social.skillsTitle')}
      action={
        isOwn ? (
          <Pressable accessibilityRole="button" onPress={() => setAdding(true)} hitSlop={8}>
            <Text variant="caption" style={{ color: colors.accent }}>
              {t('social.addSkill')}
            </Text>
          </Pressable>
        ) : null
      }
    >
      {items.length === 0 && !adding ? (
        <Text tone="muted">{t('social.skillsEmpty')}</Text>
      ) : (
        <View style={styles.skillWrap}>
          {items.map((item) => (
            <View key={item.id} style={[styles.skillChip, { borderColor: colors.border }]}>
              <Text variant="caption">{item.name}</Text>
              {isOwn ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void remove.mutate(item.id)}
                  hitSlop={6}
                >
                  <Text variant="caption" tone="danger">
                    ×
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {adding ? (
        <View style={styles.editBlock}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('social.skillPlaceholder')}
            placeholderTextColor={colors.foregroundMuted}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />
          <View style={styles.row}>
            <Button
              label={t('common.save')}
              loading={create.isPending}
              disabled={!name.trim()}
              onPress={() =>
                create.mutate({ name: name.trim() }, {
                  onSuccess: () => {
                    setName('');
                    setAdding(false);
                  },
                })
              }
            />
            <Button label={t('common.cancel')} variant="outline" onPress={() => setAdding(false)} />
          </View>
        </View>
      ) : null}
    </SidebarCard>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, marginTop: spacing.md },
  card: { overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  cardBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  careerItem: { gap: 2, paddingVertical: spacing.xs },
  careerDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  desc: { marginTop: spacing.xs },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editBlock: { gap: spacing.sm },
  textArea: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
});
