import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { TransactionsPanel } from '@/features/admin/transactions-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.transactions') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Ödeme talimatı', detail: 'Toplu hakediş aktarımının hazırlanması.' },
  { label: 'Dışa aktarma', detail: 'Muhasebe için CSV çıktısı.' },
  { label: 'Cüzdan detayı', detail: 'Tek bir satıcının hareket dökümü ve bakiye geçmişi.' },
  { label: 'Düzeltme kaydı', detail: 'Ters kayıtla manuel düzeltme girişi.' },
];

export default function TransactionsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.transactions"
      descriptionKey="admin.transactionsHint"
      dataSource="POST /admin/transactions/adjustments"
      capabilities={CAPABILITIES}
    >
      <TransactionsPanel />
    </ModuleScaffold>
  );
}
