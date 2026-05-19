import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { json, urlencoded, static as expressStatic } from 'express';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory (for file preview access)
  // Add CORS headers for static files to allow 3D viewer access
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  }, expressStatic('uploads'))

  // Increase body parser limits to support large file uploads (35MB)
  app.use(json({ limit: '35mb' }));
  app.use(urlencoded({ extended: true, limit: '35mb' }));

  // Enable CORS for 3D viewer and frontend access
  // Support both production and development origins, plus Vercel preview deploys
  const explicitOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
      ];

  // Allow all Vercel preview URLs for this project (gestionale-shen3d-*.vercel.app)
  // so non-canonical deployment URLs don't need to be added by hand.
  const vercelPreviewPattern = /^https:\/\/gestionale-shen3d-[a-z0-9-]+\.vercel\.app$/;

  app.enableCors({
    origin: (origin, callback) => {
      // No origin = curl, server-to-server, mobile apps → allow
      if (!origin) return callback(null, true);
      if (explicitOrigins.includes(origin)) return callback(null, true);
      if (vercelPreviewPattern.test(origin)) return callback(null, true);
      callback(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Dental Lab CRM API')
    .setDescription('API documentation for Dental Lab CRM - Shen3D')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('clients', 'Client (Dentist) management')
    .addTag('cases', 'Case/Order management')
    .addTag('files', 'File upload and management')
    .addTag('chat', 'Chat messaging')
    .addTag('price-lists', 'Price list management')
    .addTag('notifications', 'Notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
