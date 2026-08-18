import { Global, Module } from '@nestjs/common';

import { AppConfigService } from '@config/app-config.service';

import { AI_PROVIDER, type AiProvider } from './ai-provider';
import { AiService } from './ai.service';
import { AnthropicProvider } from './anthropic.provider';
import { MockAiProvider } from './mock-ai.provider';
import { OpenAiProvider } from './openai.provider';

/**
 * Etkin AI sürücüsünü ortam değişkeninden seçer.
 *
 * Yeni bir sağlayıcı eklemek, arayüzü uygulayan adaptörü yazıp buradaki
 * eşlemeye bir satır eklemekten ibarettir.
 */
function selectProvider(
  config: AppConfigService,
  mock: MockAiProvider,
  openai: OpenAiProvider,
  anthropic: AnthropicProvider,
): AiProvider {
  const driver = config.ai.driver;
  if (driver === 'mock') return mock;
  if (driver === 'openai') return openai;
  if (driver === 'anthropic') return anthropic;
  throw new Error(`AI sağlayıcısı bilinmiyor: ${String(driver)}`);
}

@Global()
@Module({
  providers: [
    MockAiProvider,
    OpenAiProvider,
    AnthropicProvider,
    {
      provide: AI_PROVIDER,
      inject: [AppConfigService, MockAiProvider, OpenAiProvider, AnthropicProvider],
      useFactory: selectProvider,
    },
    AiService,
  ],
  exports: [AI_PROVIDER, AiService],
})
export class AiProviderModule {}
