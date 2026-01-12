import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from '@libs/config/swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ConfigService 가져오기
  const configService = app.get(ConfigService);

  // 로컬 스토리지 사용 시 정적 파일 서빙 설정
  const storageType = configService.get<string>('STORAGE_TYPE', 'local');
  if (storageType === 'local') {
    const uploadDir = configService.get<string>(
      'LOCAL_UPLOAD_DIR',
      join(process.cwd(), 'uploads'),
    );
    app.useStaticAssets(uploadDir, {
      prefix: '/uploads',
    });
    console.log(`📁 정적 파일 서빙: /uploads → ${uploadDir}`);
  }

  // 전역 Validation Pipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: false, // 정의되지 않은 속성이 있어도 에러 발생 안 함
    }),
  );

  // Global Prefix 설정
  app.setGlobalPrefix('api');

  // CORS 설정
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    exposedHeaders: '*',
    credentials: false,
  });

  // Swagger 문서 설정
  setupSwagger(app, {
    title: 'Lumir CMS API',
    description: '루미르 CMS 백엔드 API 문서',
    version: '1.0',
    path: 'admin/api-docs',
    tags: [
      { name: 'A-1. 관리자 - 언어', description: '언어 관리 API' },
      { name: 'A-2. 관리자 - 브로슈어', description: '브로슈어 관리 API' },
      { name: 'A-3. 관리자 - 전자공시', description: '전자공시 관리 API' },
    ],
  });

  const port = configService.get<number>('PORT', 4001);
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 API Documentation: http://localhost:${port}/api/admin/api-docs`,
  );
}

bootstrap();
