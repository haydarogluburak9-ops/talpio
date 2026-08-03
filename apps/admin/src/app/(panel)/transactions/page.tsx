import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { TransactionsPanel } from '@/features/admin/transactions-panel';

export const metadata: Metadata = { title: 'İşlemler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Ödeme talimatı', detail: 'Toplu hakediş aktarımının hazırlanması.' },
  { label: 'Dışa aktarma', detail: 'Muhasebe için CSV çıktısı.' },
  { label: 'Cüzdan detayı', detail: 'Tek bir ustanın hareket dökümü ve bakiye geçmişi.' },
  { label: 'Düzeltme kaydı', detail: 'Ters kayıtla manuel düzeltme girişi.' },
];

export default function TransactionsPage() {
  return (
    <ModuleScaffold
      title="İşlemler"
      description="Cüzdan hareketlerini ve para akışını takip edin."
      dataSource="POST /admin/transactions/adjustments"
      capabilities={CAPABILITIES}
    >
      <TransactionsPanel />
    </ModuleScaffold>
  );
}
