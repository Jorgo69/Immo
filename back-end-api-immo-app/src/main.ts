/**
 * Main Bootstrap - Standard 41DEVS
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import './polyfill';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Fichiers statiques (avatars uploadés)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger avec JWT Authentication
  const config = new DocumentBuilder()
    .setTitle('Immo Bénin API - Standard 41DEVS')
    .setDescription('NestJS CQRS API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🚀 API Immo Bénin - Backend CQRS                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`📍 Server:  http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api`);
  console.log('');
}
bootstrap();
