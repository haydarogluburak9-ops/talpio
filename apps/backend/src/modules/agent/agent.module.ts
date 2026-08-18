import { Module } from '@nestjs/common';

import { AdminModule } from '@modules/admin/admin.module';

import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentToolsService } from './agent-tools.service';
import { AiAssistService } from './ai-assist.service';

@Module({
  imports: [AdminModule],
  controllers: [AgentController],
  providers: [AgentService, AgentToolsService, AiAssistService],
  exports: [AgentService],
})
export class AgentModule {}
