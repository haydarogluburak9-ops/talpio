import { detectContactSharing } from './contact-detection';

describe('detectContactSharing', () => {
  it('sıradan mesajı işaretlemez', () => {
    expect(detectContactSharing('Yarın sabah 9 gibi gelebilirim.').isFlagged).toBe(false);
  });

  it('boş gövdeyi işaretlemez', () => {
    expect(detectContactSharing(null).isFlagged).toBe(false);
    expect(detectContactSharing('').isFlagged).toBe(false);
  });

  it('telefon numarasını yakalar', () => {
    expect(detectContactSharing('Beni 05321234567 numaradan arayın').reasons).toContain('PHONE');
  });

  it('boşluk ve tire ile yazılmış numarayı yakalar', () => {
    expect(detectContactSharing('0532 123 45 67').reasons).toContain('PHONE');
  });

  it('e-posta adresini yakalar', () => {
    expect(detectContactSharing('ahmet.yilmaz@ornek.com adresine yazın').reasons).toContain(
      'EMAIL',
    );
  });

  it('harfle yazılmış numarayı yakalar', () => {
    expect(
      detectContactSharing('sıfır beş üç iki bir iki üç dört beş').reasons,
    ).toContain('SPELLED_PHONE');
  });

  it('platform dışına yönlendirmeyi yakalar', () => {
    expect(detectContactSharing('WhatsApp üzerinden konuşalım').reasons).toContain('OFF_PLATFORM');
  });

  it('fiyat ve ölçü içeren mesajı numara sanmaz', () => {
    expect(detectContactSharing('Fiyat 1500 TL, iş 2 saat sürer.').isFlagged).toBe(false);
  });

  it('tarih ve saat yazımını numara sanmaz', () => {
    expect(detectContactSharing('12.03.2026 saat 14:30 uygun mu?').isFlagged).toBe(false);
  });
});
