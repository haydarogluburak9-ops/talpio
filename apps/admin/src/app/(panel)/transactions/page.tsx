import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'İşlemler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Hareket defteri', detail: 'Her kaydın çift taraflı borç/alacak görünümü.' },
  { label: 'Usta hakedişi', detail: 'Komisyon düşülmüş net tutarın hesaplanması.' },
  { label: 'Ödeme talimatı', detail: 'Toplu hakediş aktarımının hazırlanması.' },
  { label: 'Dışa aktarma', detail: 'Muhasebe için CSV çıktısı.' },
];

export default function TransactionsPage() {
  return (
    <ModuleScaffold
      title="İşlemler"
      description="Cüzdan hareketlerini ve para akışını takip edin."
      dataSource="GET /admin/payments/transactions"
      capabilities={CAPABILITIES}
    />
  );
}
