import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { AppConfigModule } from '@config/config.module';
import { AppConfigService } from '@config/app-config.service';

/** Log'a asla düz metin olarak yazılmaması gereken alanlar. */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.passwordConfirmation',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.otp',
  'req.body.code',
  'req.body.cardNumber',
  'req.body.cvv',
  'req.body.iban',
  'res.headers["set-cookie"]',
];

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const existing = req.headers['x-request-id'];
            const id = typeof existing === 'string' && existing ? existing : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          redact: { paths: REDACTED_PATHS, censor: '[gizlendi]' },
          autoLogging: {
            ignore: (req: IncomingMessage) => req.url?.startsWith('/health') ?? false,
          },
          customProps: () => ({ service: 'ustapilot-api' }),
          ...(config.isProduction
            ? {}
            : {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname,service',
                  },
                },
              }),
        },
      }),
    }),
  ],
})
export class LoggerModule {}
