import { hashRefreshToken, parseDuration } from './token.service';

describe('parseDuration', () => {
  it.each([
    ['15m', 900],
    ['1h', 3600],
    ['30d', 2_592_000],
    ['45s', 45],
  ])('%s ifadesini %i saniyeye çevirir', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(['15', 'm15', '15x', '', '1.5h'])('geçersiz biçim (%s) için hata verir', (input) => {
    expect(() => parseDuration(input)).toThrow();
  });
});

describe('hashRefreshToken', () => {
  it('aynı jeton için aynı özeti üretir', () => {
    expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'));
  });

  it('farklı jetonlar için farklı özet üretir', () => {
    expect(hashRefreshToken('abc')).not.toBe(hashRefreshToken('abd'));
  });

  it('jetonun kendisini sızdırmaz', () => {
    const token = 'gizli-yenileme-jetonu';
    expect(hashRefreshToken(token)).not.toContain(token);
  });
});
