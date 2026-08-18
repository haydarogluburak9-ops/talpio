import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { palette, radius, spacing } from '@/theme/tokens';

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  bodyKey: string;
}

const SLIDES: Slide[] = [
  { icon: 'search', titleKey: 'onboarding.slideOneTitle', bodyKey: 'onboarding.slideOneBody' },
  { icon: 'pricetags', titleKey: 'onboarding.slideTwoTitle', bodyKey: 'onboarding.slideTwoBody' },
  {
    icon: 'shield-checkmark',
    titleKey: 'onboarding.slideThreeTitle',
    bodyKey: 'onboarding.slideThreeBody',
  },
];

export default function WelcomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      router.push('/(auth)/register');
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text variant="title" tone="onBrand">
          Talpio
        </Text>
        <Button
          label={t('onboarding.skip')}
          variant="ghost"
          size="sm"
          onPress={() => router.push('/(auth)/login')}
        />
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.titleKey}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={44} color={palette.accent[400]} />
            </View>
            <Text variant="displaySm" tone="onBrand" style={styles.center}>
              {t(item.titleKey)}
            </Text>
            <Text variant="body" style={[styles.center, { color: palette.brand[200] }]}>
              {t(item.bodyKey)}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots} accessibilityElementsHidden>
        {SLIDES.map((slide, dotIndex) => (
          <View
            key={slide.titleKey}
            style={[
              styles.dot,
              {
                backgroundColor: dotIndex === index ? palette.accent[400] : palette.brand[700],
                width: dotIndex === index ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={isLast ? t('onboarding.start') : t('common.next')}
          variant="secondary"
          block
          onPress={goNext}
        />
        <Button
          label={t('nav.login')}
          variant="ghost"
          block
          onPress={() => router.push('/(auth)/login')}
          style={{ borderWidth: 1, borderColor: palette.brand[700] }}
        />
        <Text variant="caption" style={[styles.center, { color: colors.foregroundMuted }]}>
          {t('common.tagline')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.brand[900] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brand[800],
  },
  center: { textAlign: 'center' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  dot: { height: 8, borderRadius: radius.pill },
  actions: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg },
});
