import { FRAUD_VOLUME_THRESHOLDS, shouldFlagVolume } from './fraud-volume';

describe('shouldFlagVolume', () => {
  it('eşik altında bayrak açmaz', () => {
    expect(shouldFlagVolume(19, FRAUD_VOLUME_THRESHOLDS.MANY_REQUESTS)).toBe(false);
  });

  it('eşikte bayrak açar; hesap yasaklamaz', () => {
    expect(shouldFlagVolume(20, FRAUD_VOLUME_THRESHOLDS.MANY_REQUESTS)).toBe(true);
  });
});
