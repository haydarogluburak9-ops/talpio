import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatMoneyMinor } from '@talpio/localization';
import type { CommerceRequest, RequestOffer } from '@talpio/types';

import { Card } from '@/components/card';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { useMyCommerceRequests, useMyRequestOffers } from './use-requests';

type HubTab = 'requests' | 'offers';

/** Alıcının hâlâ cevap beklediği talepler. */
const OPEN_STATUSES = new Set(['DRAFT', 'PUBLISHED', 'MATCHING', 'QUOTING']);

/**
 * Profildeki ticaret alanı — webdeki `CommerceHub`'ın mobil karşılığı.
 *
 * Alıcı taleplerini ve gelen teklifleri tek yerde görür; her talebin detayına
 * ayrı ayrı girmesi gerekmez.
 */
export function CommerceHub({ variant }: { variant: 'customer' | 'provider' }) {
  const { t, locale } = useI18n();
  const colors = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<HubTab>('requests');
  const requests = useMyCommerceRequests();
  const offers = useMyRequestOffers();

  if (requests.isPending || offers.isPending) return <ListSkeleton rows={3} />;

  if (requests.isError || offers.isError) {
    return (
      <ErrorState
        title={t('commerce.hubLoadFailed')}
        retryLabel={t('common.retry')}
        onRetry={() => {
          void requests.refetch();
          void offers.refetch();
        }}
      />
    );
  }

  const requestItems = requests.data?.items ?? [];
  const offerItems = offers.data ?? [];

  const openCount = requestItems.filter((row) => OPEN_STATUSES.has(row.status)).length;
  const pendingCount = offerItems.filter((row) => row.status === 'SUBMITTED').length;
  const acceptedCount = offerItems.filter((row) => row.status === 'ACCEPTED').length;

  const tabs: { id: HubTab; label: string; count: number }[] = [
    { id: 'requests', label: t('commerce.hubRequestsTab'), count: requestItems.length },
    { id: 'offers', label: t('commerce.hubOffersTab'), count: offerItems.length },
  ];

  return (
    <View style={styles.root}>
      <Card padded={false} style={styles.header}>
        <View style={[styles.headerTop, { borderBottomColor: colors.border }]}>
          <View style={styles.headerCopy}>
            <Text variant="title">{t('commerce.hubTitle')}</Text>
            <Text variant="caption" tone="muted">
              {t('commerce.hubSubtitle')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/customer/requests/new' as never)}
            style={({ pressed }) => [
              styles.newButton,
              { backgroundColor: colors.accent },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={16} color={colors.onAccent} />
            <Text variant="caption" style={[styles.newButtonLabel, { color: colors.onAccent }]}>
              {t('commerce.hubNewRequest')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statRow}>
          <Stat label={t('commerce.hubStatOpen')} value={openCount} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat label={t('commerce.hubStatPending')} value={pendingCount} accent />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat label={t('commerce.hubStatAccepted')} value={acceptedCount} />
        </View>
      </Card>

      <View style={styles.tabRow}>
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? colors.brandStrong : colors.surface,
                  borderColor: active ? colors.brandStrong : colors.border,
                },
              ]}
            >
              <Text
                variant="caption"
                style={[styles.tabLabel, { color: active ? colors.onBrand : colors.foregroundMuted }]}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.tabCount,
                  { backgroundColor: active ? 'rgba(255,255,255,0.22)' : colors.surfaceMuted },
                ]}
              >
                <Text
                  variant="overline"
                  style={{ color: active ? colors.onBrand : colors.foregroundMuted }}
                >
                  {item.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {tab === 'requests' ? (
        requestItems.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title={t('commerce.hubRequestsEmptyTitle')}
            description={t('commerce.hubRequestsEmptyBody')}
            actionLabel={t('commerce.hubNewRequest')}
            onAction={() => router.push('/customer/requests/new' as never)}
          />
        ) : (
          <View style={styles.list}>
            {requestItems.map((row) => (
              <RequestRow key={row.id} request={row} />
            ))}
          </View>
        )
      ) : offerItems.length === 0 ? (
        <EmptyState
          icon="pricetags-outline"
          title={t('commerce.hubOffersEmptyTitle')}
          description={t('commerce.hubOffersEmptyBody')}
        />
      ) : (
        <View style={styles.list}>
          {offerItems.map((row) => (
            <OfferRow key={row.id} offer={row} locale={locale} variant={variant} />
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  const colors = useColors();

  return (
    <View style={styles.stat}>
      <Text
        variant="displaySm"
        style={{ color: accent && value > 0 ? colors.accent : colors.foreground }}
      >
        {value}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function RequestRow({ request }: { request: CommerceRequest }) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const pending = request.pendingOfferCount ?? 0;
  const total = request.offerCount ?? 0;
  const isPrivate = request.visibility === 'INVITE_ONLY';

  return (
    <Card onPress={() => router.push(`/customer/requests/${request.id}` as never)}>
      <View style={styles.rowTop}>
        <Text variant="bodyStrong" numberOfLines={2} style={styles.flex}>
          {request.title}
        </Text>
        {pending > 0 ? (
          <View style={[styles.pendingBadge, { backgroundColor: colors.accent }]}>
            <Text variant="overline" style={{ color: colors.onAccent }}>
              {t('commerce.hubPendingBadge', { count: pending })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Chip label={t(`requestStatus.${request.status}`)} />
        {isPrivate ? (
          <Chip label={t('commerce.hubPrivate')} icon="lock-closed-outline" />
        ) : null}
        <Text variant="caption" tone="muted">
          {t('commerce.hubOfferCount', { count: total })}
        </Text>
      </View>
    </Card>
  );
}

function OfferRow({
  offer,
  locale,
  variant,
}: {
  offer: RequestOffer;
  locale: Parameters<typeof formatMoneyMinor>[2];
  variant: 'customer' | 'provider';
}) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const seller = offer.seller;
  const initials = (seller?.name ?? '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase();

  return (
    <Card>
      <View style={styles.offerTop}>
        <Pressable
          accessibilityRole="button"
          disabled={!seller?.username}
          onPress={() => router.push(`/${variant}/u/${seller?.username}` as never)}
          style={styles.sellerRow}
        >
          <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
            <Text variant="caption" style={styles.initials}>
              {initials}
            </Text>
          </View>
          <View style={styles.flex}>
            <View style={styles.sellerNameRow}>
              <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                {seller?.name ?? '—'}
              </Text>
              {seller?.isVerified ? (
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={colors.info}
                  accessibilityLabel={t('commerce.hubVerified')}
                />
              ) : null}
            </View>
            {offer.request ? (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {offer.request.title}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <Text variant="title" style={{ color: colors.foreground }}>
          {formatMoneyMinor(offer.amountMinor, offer.currency, locale)}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Chip label={t(`offerStatus.${offer.status}`)} />
        {offer.deliveryDays ? (
          <Chip
            label={t('commerce.hubDeliveryDays', { count: offer.deliveryDays })}
            icon="cube-outline"
          />
        ) : null}
        {offer.shippingIncluded ? (
          <Chip label={t('social.shippingIncludedYes')} icon="shield-checkmark-outline" />
        ) : null}
        {offer.validUntil ? (
          <Chip
            label={new Date(offer.validUntil).toLocaleDateString(locale)}
            icon="time-outline"
          />
        ) : null}
      </View>

      {offer.request ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/customer/requests/${offer.request?.id}` as never)}
          style={styles.reviewLink}
        >
          <Text variant="caption" style={[styles.reviewLabel, { color: colors.accentOnSurface }]}>
            {t('commerce.hubReview')}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accentOnSurface} />
        </Pressable>
      ) : null}
    </Card>
  );
}

function Chip({ label, icon }: { label: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const colors = useColors();

  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}>
      {icon ? <Ionicons name={icon} size={12} color={colors.foregroundMuted} /> : null}
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },

  header: { overflow: 'hidden' },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerCopy: { flex: 1, gap: 2 },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
  },
  newButtonLabel: { fontWeight: '700' },

  statRow: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, gap: 2, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  statDivider: { width: 1 },

  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.control,
    borderWidth: 1,
  },
  tabLabel: { fontWeight: '700' },
  tabCount: {
    minWidth: 22,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },

  list: { gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  pendingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.control,
  },

  offerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  sellerRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontWeight: '700' },
  reviewLink: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  reviewLabel: { fontWeight: '700' },
});
