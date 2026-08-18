import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { AppConfigService } from '@config/app-config.service';

/**
 * Canlı sağlayıcıya istek atmaz (kota/anahtar yakmaz).
 * Yalnızca sürücü yapılandırmasını raporlar; mock "canlı AI" diye satılmaz.
 */
@Injectable()
export class AiHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly config: AppConfigService,
  ) {}

  isHealthy(key: string): HealthIndicatorResult {
    const indicator = this.healthIndicatorService.check(key);
    const driver = this.config.get('AI_DRIVER');
    const configured =
      driver === 'mock' ||
      (driver === 'openai' && Boolean(this.config.get('AI_OPENAI_API_KEY'))) ||
      (driver === 'anthropic' && Boolean(this.config.get('AI_ANTHROPIC_API_KEY')));

    const details = {
      driver,
      configured,
      liveProbe: false,
    };

    return configured
      ? indicator.up(details)
      : indicator.down({ ...details, message: `${driver} sürücüsü için anahtar yok` });
  }
}
