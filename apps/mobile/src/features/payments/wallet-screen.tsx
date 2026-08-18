import { FlatList, StyleSheet, View } from 'react-native';

import { formatDateTime, formatMoney, transactionTypeLabel } from '@talpio/localization';
import type { Transaction } from '@talpio/types';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import {
  flattenTransactionPages,
  useMyTransactionsInfinite,
  useProviderWallet,
} from './use-payments';

/** Satıcının cüzdanı: kullanılabilir bakiye, bloke hakediş ve hareket dökümü. */
export function WalletScreen() {
  const { t, locale } = useI18n();

  const wallet = useProviderWallet();
  const transactions = useMyTransactionsInfinite();
  const items = flattenTransactionPages(transactions.data?.pages);

  if (wallet.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('payment.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void wallet.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(transaction) => transaction.id}
        contentContainerStyle={styles.list}
        refreshing={transactions.isRefetching}
        onRefresh={() => {
          void wallet.refetch();
          void transactions.refetch();
        }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (transactions.hasNextPage && !transactions.isFetchingNextPage) {
            void transactions.fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Card>
              {/* Veri gelmediyse tutar uydurulmaz. */}
              <Text variant="displaySm">
                {wallet.data ? formatMoney(wallet.data.balance, locale) : '—'}
              </Text>
              <Text variant="caption" tone="muted">
                {t('payment.availableBalance')}
              </Text>
            </Card>

            <Card>
              <Text variant="displaySm">
                {wallet.data ? formatMoney(wallet.data.pending, locale) : '—'}
              </Text>
              <Text variant="caption" tone="muted">
                {t('payment.pendingBalance')}
              </Text>
              <Text variant="caption" tone="muted">
                {t('payment.pendingHint')}
              </Text>
            </Card>

            <Text variant="bodyStrong">{t('payment.transactionsTitle')}</Text>

            {transactions.isPending ? <ListSkeleton rows={3} /> : null}

            {transactions.isError ? (
              <Text variant="caption" tone="danger">
                {t('payment.loadFailed')}
              </Text>
            ) : null}

            {transactions.isSuccess && items.length === 0 ? (
              <EmptyState
                icon="swap-vertical-outline"
                title={t('payment.transactionsEmpty')}
                description={t('payment.transactionsEmptyDescription')}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ListFooterComponent={
          transactions.isFetchingNextPage ? (
            <Card>
              <Text variant="caption" tone="muted">
                {t('common.loading')}
              </Text>
            </Card>
          ) : null
        }
      />
    </Screen>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const { locale } = useI18n();
  const outgoing = transaction.amount.amountMinor < 0;

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{transactionTypeLabel(transaction.type, locale)}</Text>
          <Text variant="caption" tone="muted">
            {formatDateTime(transaction.createdAt, locale)}
          </Text>
          {transaction.description ? (
            <Text variant="caption" tone="muted">
              {transaction.description}
            </Text>
          ) : null}
        </View>
        <Text variant="bodyStrong" tone={outgoing ? 'danger' : 'success'}>
          {formatMoney(transaction.amount, locale)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  header: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1 },
});
