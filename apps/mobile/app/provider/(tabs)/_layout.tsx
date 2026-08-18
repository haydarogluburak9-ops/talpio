import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, palette } from '@/theme/tokens';

export default function ProviderTabsLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.foreground,
        tabBarActiveTintColor: palette.accent[500],
        tabBarInactiveTintColor: colors.foregroundMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: MIN_TOUCH_TARGET + 10,
          paddingTop: 4,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: t('nav.feed'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t('nav.discover'),
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="available"
        options={{
          title: t('nav.requests'),
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('nav.messages'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="dashboard" options={{ href: null, title: t('nav.dashboard') }} />
      <Tabs.Screen name="active" options={{ href: null, title: t('nav.activeJobs') }} />
      <Tabs.Screen name="earnings" options={{ href: null, title: t('nav.earnings') }} />
    </Tabs>
  );
}
