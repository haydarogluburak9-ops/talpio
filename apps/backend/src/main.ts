import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { ApiErrorResponseDto } from './common/dto/api-response.dto';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);
  app.useLogger(app.get(PinoLogger));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.set('trust proxy', 1);

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'Idempotency-Key'],
    exposedHeaders: ['x-request-id'],
  });

  app.setGlobalPrefix(config.apiPrefix, { exclude: ['health', 'health/ready'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      stopAtFirstError: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(config.isProduction));
  app.enableShutdownHooks();

  if (!config.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('UstaPilot API')
      .setDescription('Hizmet pazaryeri platformu API dokümantasyonu')
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addServer(`/${config.apiPrefix}`)
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [ApiErrorResponseDto],
    });

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Reflector'ın hazır olduğunu doğrular; interceptor bu bağımlılığı kullanır.
  app.get(Reflector);

  await app.listen(config.port, '0.0.0.0');

  const logger = app.get(PinoLogger);
  logger.log(
    `UstaPilot API ${config.nodeEnv} modunda http://localhost:${config.port}/${config.apiPrefix} adresinde çalışıyor`,
  );
  if (!config.isProduction) {
    logger.log(`Swagger: http://localhost:${config.port}/docs`);
  }
}

void bootstrap();
