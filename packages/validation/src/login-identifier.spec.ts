import { parseLoginIdentifier } from './login-identifier';

describe('parseLoginIdentifier', () => {
  it('e-postayı tanır', () => {
    expect(parseLoginIdentifier('  Ayse@Example.COM ')).toEqual({
      kind: 'email',
      value: 'ayse@example.com',
    });
  });

  it('@ ile başlayan kullanıcı adını tanır', () => {
    expect(parseLoginIdentifier('@Ayse.Yilmaz')).toEqual({
      kind: 'username',
      value: 'ayse.yilmaz',
    });
  });

  it('E.164 telefonu tanır', () => {
    expect(parseLoginIdentifier('+905321234567')).toEqual({
      kind: 'phone',
      value: '+905321234567',
    });
  });

  it('0 ile başlayan TR numarasını +90 yapar', () => {
    expect(parseLoginIdentifier('0532 123 45 67')).toEqual({
      kind: 'phone',
      value: '+905321234567',
    });
  });

  it('00 ile başlayan uluslararası numarayı tanır', () => {
    expect(parseLoginIdentifier('00905321234567')).toEqual({
      kind: 'phone',
      value: '+905321234567',
    });
  });

  it('düz kullanıcı adını tanır', () => {
    expect(parseLoginIdentifier('ayse.yilmaz')).toEqual({
      kind: 'username',
      value: 'ayse.yilmaz',
    });
  });
});
