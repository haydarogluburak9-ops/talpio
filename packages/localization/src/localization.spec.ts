import { NotificationType } from '@talpio/types';

import { formatDuration, formatMoneyMinor, formatRating, formatRelativeTime } from './format';
import { renderNotification } from './notifications';
import { createTranslator, interpolate } from './translator';
import { ar } from './locales/ar';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { tr } from './locales/tr';

describe('çeviri katalogları', () => {
  function collectKeys(node: unknown, prefix = ''): string[] {
    if (typeof node !== 'object' || node === null) return [prefix];
    return Object.entries(node).flatMap(([key, value]) =>
      collectKeys(value, prefix ? `${prefix}.${key}` : key),
    );
  }

  it('tüm kataloglar İngilizce ile aynı anahtarlara sahiptir', () => {
    const english = collectKeys(en).sort();
    for (const catalog of [tr, de, es, fr, ar]) {
      expect(collectKeys(catalog).sort()).toEqual(english);
    }
  });

  it('hiçbir metin boş değildir', () => {
    for (const catalog of [tr, en, de, es, fr, ar]) {
      const flat = JSON.stringify(catalog);
      expect(flat).not.toContain('""');
    }
  });

  it('landing metinleri sahte üretim metriği taşımaz', () => {
    const home = JSON.stringify(tr.home) + JSON.stringify(en.home);
    expect(home).not.toMatch(/1M\+|50K\+|10M\+|200\.000|200,000/);
  });
});

describe('createTranslator', () => {
  it('Türkçe metni çözer', () => {
    expect(createTranslator('tr').t('common.tagline')).toBe(
      'İste. Teklif al. Fırsatı yakala.',
    );
  });

  it('İngilizce metni çözer', () => {
    expect(createTranslator('en').t('common.tagline')).toBe(
      'Request. Get offers. Catch the deal.',
    );
  });

  it('desteklenmeyen dilde varsayılana düşer', () => {
    expect(createTranslator('xx').locale).toBe('en');
  });

  it('yeni dillerde chrome metinlerini çözer', () => {
    expect(createTranslator('de').t('common.language')).toBe('Sprache');
    expect(createTranslator('es').t('social.feedTitle')).toBe('Feed');
    expect(createTranslator('fr').t('home.heroAskOffer')).toBe('Demander un devis');
    expect(createTranslator('ar').t('home.heroSaleBadge')).toBe('تخفيض');
  });

  it('eksik anahtarda anahtarın kendisini döndürür', () => {
    expect(createTranslator('tr').t('bulunmayan.anahtar')).toBe('bulunmayan.anahtar');
  });

  it('parametreleri yerleştirir', () => {
    expect(createTranslator('tr').t('job.offerCount', { count: 5 })).toBe('5 teklif');
  });
});

describe('renderNotification', () => {
  it('her bildirim türü iki dilde de metin taşır', () => {
    for (const type of Object.values(NotificationType)) {
      for (const locale of ['tr', 'en']) {
        const rendered = renderNotification(type, {}, locale);
        // Eksik anahtarda çevirici anahtarın kendisini döndürür; katalog boşluğu
        // böyle yakalanır.
        expect(rendered.title).not.toContain('notification.');
        expect(rendered.body).not.toContain('notification.');
      }
    }
  });

  it('tutarı kullanıcının diliyle biçimlendirir', () => {
    const rendered = renderNotification(
      NotificationType.OFFER_RECEIVED,
      {
        jobTitle: 'Kombi bakımı',
        providerName: 'Yılmaz Ticaret',
        amountMinor: 180000,
        currency: 'TRY',
      },
      'tr',
    );

    expect(rendered.body).toContain('1.800,00');
    expect(rendered.body).toContain('Yılmaz Ticaret');
  });

  it('yerleştirilmemiş değişken bırakmaz', () => {
    const rendered = renderNotification(
      NotificationType.JOB_MATCHED,
      { jobTitle: 'Priz arızası', categoryName: 'Elektrik', districtName: 'Şahinbey' },
      'en',
    );

    expect(rendered.body).not.toContain('{');
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
