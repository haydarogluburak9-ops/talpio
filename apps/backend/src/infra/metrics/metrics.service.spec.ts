import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('sayaçları artırır', () => {
    const metrics = new MetricsService();
    metrics.increment('api_requests');
    metrics.increment('api_errors', 2);
    expect(metrics.snapshot().api_requests).toBe(1);
    expect(metrics.snapshot().api_errors).toBe(2);
    expect(metrics.snapshot().ai_calls).toBe(0);
  });
});
