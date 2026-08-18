import { Global, Module } from '@nestjs/common';

import { FraudService } from './fraud.service';

@Global()
@Module({
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
