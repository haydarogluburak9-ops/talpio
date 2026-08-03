import { useEffect, useState } from 'react';

/**
 * Şu anki zamanı durum olarak verir ve belirli aralıklarla tazeler.
 *
 * Render sırasında doğrudan `Date.now()` okumak render'ı saf olmaktan çıkarır;
 * ayrıca teklif geçerlilik süresi ekran açıkken dolabilir ve arayüz bunu kendi
 * başına fark edemez. Zamanı durumda tutmak iki sorunu birden çözer.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
