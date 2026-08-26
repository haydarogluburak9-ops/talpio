import { resolveLocalizedText, resolveOptionLabel } from './localized-text';

describe('resolveLocalizedText', () => {
  it('istenen dili döndürür', () => {
    expect(resolveLocalizedText({ tr: 'Viskozite', en: 'Viscosity' }, 'tr')).toBe('Viskozite');
    expect(resolveLocalizedText({ tr: 'Viskozite', en: 'Viscosity' }, 'en')).toBe('Viscosity');
  });

  it('çevirisi olmayan dilde İngilizceye düşer', () => {
    expect(resolveLocalizedText({ tr: 'Ambalaj', en: 'Packaging' }, 'de')).toBe('Packaging');
  });

  it('İngilizce de yoksa ilk dolu değere düşer', () => {
    expect(resolveLocalizedText({ tr: 'Ambalaj' }, 'fr')).toBe('Ambalaj');
  });

  it('boş çeviriyi atlar', () => {
    expect(resolveLocalizedText({ de: '', en: '', tr: 'Ambalaj' }, 'de')).toBe('Ambalaj');
  });

  it('düz stringi her dilde aynen kullanır', () => {
    expect(resolveLocalizedText('%', 'tr')).toBe('%');
    expect(resolveLocalizedText('%', 'ar')).toBe('%');
  });

  it('tanımsız ve boş sözlükte boş metin döndürür', () => {
    expect(resolveLocalizedText(undefined, 'tr')).toBe('');
    expect(resolveLocalizedText({}, 'tr')).toBe('');
  });
});

describe('resolveOptionLabel', () => {
  it('etiketi dile göre çözer, değeri değiştirmez', () => {
    const option = { value: 'drum', label: { tr: 'Varil', en: 'Drum' } };
    expect(resolveOptionLabel(option, 'tr')).toBe('Varil');
    expect(resolveOptionLabel(option, 'en')).toBe('Drum');
    expect(option.value).toBe('drum');
  });

  it('etiket boşsa saklanan değeri gösterir', () => {
    expect(resolveOptionLabel({ value: 'ibc', label: {} }, 'tr')).toBe('ibc');
  });
});
