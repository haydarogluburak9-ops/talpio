import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatMoneyMinor } from '@talpio/localization';
import type { CommerceRequest, RequestOffer } from '@talpio/types';

import { Card } from '@/components/card';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { useMatchedRequests, useMyCommerceRequests, useMyRequestOffers } from './use-requests';

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
  const requests = useMyCommerceRequests();
  const offers = useMyRequestOffers();
  const incoming = useMatchedRequests();

  if (requests.isPending || offers.isPending) return <ListSkeleton rows={3} />;

  if (requests.isError || offers.isError) {
    return (
      <ErrorState
        title={t('commerce.hubLoadFailed')}
        retryLabel={t('common.retry')}
        onRetry={() => {
          void requests.refetch();
          void offers.refetch();
          void incoming.refetch();
        }}
      />
    );
  }

  const requestItems = requests.data?.items ?? [];
  const offerItems = offers.data ?? [];
  const incomingItems = incoming.isError ? [] : (incoming.data?.items ?? []);
  const openCount = requestItems.filter((row) => OPEN_STATUSES.has(row.status)).length;

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
      </Card>

      <Card padded={false} style={[styles.lane, { borderLeftColor: colors.accent }]}>
        <View style={[styles.laneHead, { borderBottomColor: colors.border }]}>
          <Text variant="overline" style={{ color: colors.accent }}>
            {t('commerce.hubYouOpened')}
          </Text>
          <Text variant="bodyStrong">{t('commerce.hubBuyLaneTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t('commerce.hubBuyLaneHint')}
          </Text>
          <Text variant="caption" tone="muted">
            {openCount} · {t('commerce.hubStatOpen')}
          </Text>
        </View>
        <View style={styles.laneBody}>
          {requestItems.length === 0 ? (
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
                <RequestRow key={row.id} request={row} direction="out" />
              ))}
            </View>
          )}
          <Text variant="bodyStrong" style={styles.laneSubhead}>
            {t('commerce.hubOffersOnYoursTitle')}
          </Text>
          <Text variant="caption" tone="muted">
            {t('commerce.hubOffersOnYoursHint')}
          </Text>
          {offerItems.length === 0 ? (
            <Text variant="caption" tone="muted" style={styles.laneSubhead}>
              {t('commerce.hubOffersEmptyBody')}
            </Text>
          ) : (
            <View style={styles.list}>
              {offerItems.map((row) => (
                <OfferRow key={row.id} offer={row} locale={locale} variant={variant} />
              ))}
            </View>
          )}
        </View>
      </Card>

      <Card padded={false} style={[styles.lane, { borderLeftColor: colors.info }]}>
        <View style={[styles.laneHead, { borderBottomColor: colors.border }]}>
          <Text variant="overline" style={{ color: colors.info }}>
            {t('commerce.hubCameToYou')}
          </Text>
          <Text variant="bodyStrong">{t('commerce.hubSellLaneTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t('commerce.hubSellLaneHint')}
          </Text>
        </View>
        <View style={styles.laneBody}>
          {incoming.isPending ? (
            <ListSkeleton rows={2} />
          ) : incomingItems.length === 0 ? (
            <EmptyState
              icon="download-outline"
              title={t('commerce.hubIncomingEmptyTitle')}
              description={t('commerce.hubIncomingEmptyBody')}
            />
          ) : (
            <View style={styles.list}>
              {incomingItems.map((row) => (
                <RequestRow key={row.id} request={row} direction="in" />
              ))}
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

function RequestRow({
  request,
  direction,
}: {
  request: CommerceRequest;
  direction: 'out' | 'in';
}) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const pending = request.pendingOfferCount ?? 0;
  const total = request.offerCount ?? 0;
  const isPrivate = request.visibility === 'INVITE_ONLY';

  return (
    <Card onPress={() => router.push(`/customer/requests/${request.id}` as never)}>
      <View style={styles.rowTop}>
        <View style={styles.flex}>
          <Chip
            label={direction === 'out' ? t('commerce.hubYouOpened') : t('commerce.hubCameToYou')}
          />
          <Text variant="bodyStrong" numberOfLines={2} style={styles.laneSubhead}>
            {request.title}
          </Text>
        </View>
        {direction === 'in' ? (
          <View style={[styles.pendingBadge, { backgroundColor: colors.info }]}>
            <Text variant="overline" style={{ color: colors.onAccent }}>
              {t('commerce.hubGiveOffer')}
            </Text>
          </View>
        ) : pending > 0 ? (
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
          {direction === 'out'
            ? t('commerce.hubOfferCount', { count: total })
            : t('commerce.hubAwaitingYourOffer')}
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
            {offer.note ? (
              <Text variant="caption" numberOfLines={2}>
                {offer.note}
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

  lane: { borderLeftWidth: 4, overflow: 'hidden' },
  laneHead: { gap: 4, padding: spacing.lg, borderBottomWidth: 1 },
  laneBody: { gap: spacing.sm, padding: spacing.lg },
  laneSubhead: { marginTop: spacing.sm },

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
