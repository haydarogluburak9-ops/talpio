import { FREE_CORE_CAPABILITIES, isLeadPaywallEnabled } from './free-core-policy';

describe('free-core-policy', () => {
  it('lead paywall kapalıdır', () => {
    expect(isLeadPaywallEnabled()).toBe(false);
  });

  it('ücretsiz çekirdek yetenek listesini içerir', () => {
    expect(FREE_CORE_CAPABILITIES).toEqual(
      expect.arrayContaining(['account', 'request', 'offer', 'message', 'follow']),
    );
  });
});
