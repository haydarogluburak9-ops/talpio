import { formatDuration, formatMoneyMinor, formatRating, formatRelativeTime } from './format';
import { createTranslator, interpolate } from './translator';
import { en } from './locales/en';
import { tr } from './locales/tr';

describe('çeviri katalogları', () => {
  function collectKeys(node: unknown, prefix = ''): string[] {
    if (typeof node !== 'object' || node === null) return [prefix];
    return Object.entries(node).flatMap(([key, value]) =>
      collectKeys(value, prefix ? `${prefix}.${key}` : key),
    );
  }

  it('İngilizce katalog Türkçe ile aynı anahtarlara sahiptir', () => {
    expect(collectKeys(en).sort()).toEqual(collectKeys(tr).sort());
  });

  it('hiçbir metin boş değildir', () => {
    for (const catalog of [tr, en]) {
      const flat = JSON.stringify(catalog);
      expect(flat).not.toContain('""');
    }
  });
});

describe('createTranslator', () => {
  it('Türkçe metni çözer', () => {
    expect(createTranslator('tr').t('common.tagline')).toBe(
      'Doğru usta. Doğru fiyat. Güvenli hizmet.',
    );
  });

  it('İngilizce metni çözer', () => {
    expect(createTranslator('en').t('common.tagline')).toBe(
      'The right pro. The right price. Safe service.',
    );
  });

  it('desteklenmeyen dilde Türkçeye düşer', () => {
    expect(createTranslator('de').locale).toBe('tr');
  });

  it('eksik anahtarda anahtarın kendisini döndürür', () => {
    expect(createTranslator('tr').t('bulunmayan.anahtar')).toBe('bulunmayan.anahtar');
  });

  it('parametreleri yerleştirir', () => {
    expect(createTranslator('tr').t('job.offerCount', { count: 5 })).toBe('5 teklif');
  });
});

describe('interpolate', () => {
  it('karşılığı olmayan yer tutucuyu olduğu gibi bırakır', () => {
    expect(interpolate('{a} ve {b}', { a: '1' })).toBe('1 ve {b}');
  });
});

describe('biçimlendiriciler', () => {
  it('kuruşu Türk lirasına çevirir', () => {
    const formatted = formatMoneyMinor(149_90, 'TRY', 'tr');
    expect(formatted).toContain('149,90');
  });

  it('sıfır tutarı doğru gösterir', () => {
    expect(formatMoneyMinor(0, 'TRY', 'tr')).toContain('0,00');
  });

  it('süreyi saat ve dakika olarak yazar', () => {
    expect(formatDuration(150, 'tr')).toBe('2 sa 30 dk');
    expect(formatDuration(45, 'tr')).toBe('45 dk');
    expect(formatDuration(120, 'tr')).toBe('2 sa');
  });

  it('göreli zamanı üretir', () => {
    const now = new Date('2026-03-01T12:00:00.000Z');
    const earlier = new Date('2026-03-01T09:00:00.000Z');
    expect(formatRelativeTime(earlier, 'tr', now)).toContain('3');
  });

  it('puanı tek ondalıkla yazar', () => {
    expect(formatRating(4.75, 'tr')).toBe('4,8');
    expect(formatRating(null)).toBe('—');
  });
});
