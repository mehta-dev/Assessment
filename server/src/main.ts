import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {
  json,
  urlencoded,
} from 'express';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app =
    await NestFactory.create(
      AppModule,
    );

  // Allow larger JSON payloads for profile images
  // stored as base64 strings.
  app.use(
    json({
      limit: '5mb',
    }),
  );

  app.use(
    urlencoded({
      extended: true,
      limit: '5mb',
    }),
  );

  // Parse HTTP-only authentication cookies.
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(
    process.env.PORT ?? 4000,
  );
}

bootstrap();