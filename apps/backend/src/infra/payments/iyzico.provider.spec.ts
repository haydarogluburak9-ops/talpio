import { iyzicoAuthorizationHeader } from './iyzico.provider';

describe('iyzicoAuthorizationHeader', () => {
  it('IYZWSv2 öneki ve sabit rastgele anahtarla üretir', () => {
    const header = iyzicoAuthorizationHeader('api', 'secret', '/payment/auth', '{}', '1');
    expect(header.startsWith('IYZWSv2 ')).toBe(true);
    const decoded = Buffer.from(header.slice('IYZWSv2 '.length), 'base64').toString('utf8');
    expect(decoded).toContain('apiKey:api');
    expect(decoded).toContain('randomKey:1');
    expect(decoded).toContain('signature:');
  });
});
