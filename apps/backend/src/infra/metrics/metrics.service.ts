import { Injectable } from '@nestjs/common';

export type MetricName =
  | 'api_requests'
  | 'api_errors'
  | 'ai_calls'
  | 'ai_failures'
  | 'notification_failures'
  | 'payment_failures'
  | 'upload_errors';

@Injectable()
export class MetricsService {
  private readonly counters = new Map<MetricName, number>();

  increment(name: MetricName, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }

  snapshot(): Record<MetricName, number> {
    return {
      api_requests: this.counters.get('api_requests') ?? 0,
      api_errors: this.counters.get('api_errors') ?? 0,
      ai_calls: this.counters.get('ai_calls') ?? 0,
      ai_failures: this.counters.get('ai_failures') ?? 0,
      notification_failures: this.counters.get('notification_failures') ?? 0,
      payment_failures: this.counters.get('payment_failures') ?? 0,
      upload_errors: this.counters.get('upload_errors') ?? 0,
    };
  }
}
