import { catalogName } from './category-label';

describe('catalogName', () => {
  const category = {
    slug: 'madeni-yag-kimya',
    name: 'Madeni yağ & kimya',
    nameTranslations: { tr: 'Madeni yağ & kimya', en: 'Lubricants & chemicals' },
  };

  it('veritabanı sözlüğündeki tam dil eşleşmesini kullanır', () => {
    expect(catalogName(category, 'tr')).toBe('Madeni yağ & kimya');
    expect(catalogName(category, 'en')).toBe('Lubricants & chemicals');
  });

  it('sözlükte olmayan dil için statik çeviriye düşer', () => {
    // Sözlük yalnızca tr/en taşır; Almanca ad statik katalog anahtarından gelir.
    expect(catalogName(category, 'de')).toBe('Schmierstoffe & Chemie');
  });

  it('alt kategoride statik anahtar yoktur, sözlüğün yedeğine düşer', () => {
    const subcategory = {
      slug: 'motor-yagi',
      name: 'Motor yağı',
      nameTranslations: { tr: 'Motor yağı', en: 'Engine oil' },
    };

    expect(catalogName(subcategory, 'en')).toBe('Engine oil');
    expect(catalogName(subcategory, 'de')).toBe('Engine oil');
  });

  it('hiç çeviri yoksa Türkçe ada düşer', () => {
    expect(catalogName({ name: 'Yeni kategori' }, 'en')).toBe('Yeni kategori');
    expect(catalogName({ slug: 'bilinmeyen', name: 'Yeni kategori' }, 'de')).toBe('Yeni kategori');
  });

  it('slug taşımayan referansta sözlükle çalışır', () => {
    expect(catalogName({ name: 'Madeni yağ & kimya', nameTranslations: category.nameTranslations }, 'en')).toBe(
      'Lubricants & chemicals',
    );
  });
});
