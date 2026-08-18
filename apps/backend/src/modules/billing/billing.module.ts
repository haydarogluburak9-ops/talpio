import { Global, Module } from '@nestjs/common';

import { AiCreditService } from './ai-credit.service';
import { BillingController } from './billing.controller';

@Global()
@Module({
  controllers: [BillingController],
  providers: [AiCreditService],
  exports: [AiCreditService],
})
export class BillingModule {}
