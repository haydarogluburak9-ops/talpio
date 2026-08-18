import { StyleSheet, View } from 'react-native';

import { formatDate, formatMoney, formatRelativeTime } from '@talpio/localization';
import { OfferStatus, type Offer } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { OfferStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useNow } from '@/lib/use-now';
import { spacing } from '@/theme/tokens';

export interface OfferCardProps {
  offer: Offer;
  onPress?: () => void;
  /** Müşteri ustayı, satıcı ise hangi işe verdiğini görmek ister. */
  variant?: 'customer' | 'provider';
}

export function OfferCard({ offer, onPress, variant = 'customer' }: OfferCardProps) {
  const { t, locale } = useI18n();
  const now = useNow();
  const provider = offer.provider;
  const isExpired = new Date(offer.validUntil).getTime() <= now;

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {variant === 'customer' ? (provider?.displayName ?? t('offer.detailTitle')) : formatMoney(offer.price, locale)}
        </Text>
        <OfferStatusPill status={offer.status} locale={locale} />
      </View>

      {variant === 'customer' ? (
        <Text variant="title">{formatMoney(offer.price, locale)}</Text>
      ) : null}

      {variant === 'customer' && provider ? (
        <Text variant="caption" tone="muted">
          {provider.averageRating != null
            ? `${provider.averageRating.toFixed(1)} · ${provider.reviewCount} ${t('offer.reviewCount')}`
            : t('offer.noRating')}
        </Text>
      ) : null}

      {offer.note ? (
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {offer.note}
        </Text>
      ) : null}

      <View style={styles.meta}>
        <Badge tone="neutral" label={t(`offerPriceType.${offer.priceType}`)} />
        {provider?.isVerified ? <Badge tone="success" label={t('provider.verified')} /> : null}
        {offer.materialsIncluded ? <Badge tone="info" label={t('job.materialsIncluded')} /> : null}
      </View>

      <Text variant="caption" tone="muted">
        {offer.status === OfferStatus.SUBMITTED && isExpired
          ? t('offer.expiredNote')
          : `${t('offer.validity')}: ${formatDate(offer.validUntil, locale)}`}
        {' · '}
        {formatRelativeTime(offer.createdAt, locale)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title: { flex: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
