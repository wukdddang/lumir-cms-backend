import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from '@libs/config/swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { QueryFailedExceptionFilter } from '@interface/common/filters/query-failed-exception.filter';

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
      transform: false, // 타입 자동 변환 비활성화 (정확한 타입만 허용)
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: false, // 정의되지 않은 속성이 있어도 에러 발생 안 함
    }),
  );

  // 전역 Exception Filter 설정 (TypeORM QueryFailedError 처리)
  app.useGlobalFilters(new QueryFailedExceptionFilter());

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
      { name: '공통. 인증', description: 'SSO 로그인 및 인증 API' },
      { name: '공통. 관리자 - 언어', description: '언어 관리 API' },
      { name: '공통. 관리자 - 회사 관련', description: 'SSO 조직 정보 API' },
      { name: 'A-1. 관리자 - 브로슈어', description: '브로슈어 관리 API' },
      { name: 'A-2. 관리자 - 전자공시', description: '전자공시 관리 API' },
      { name: 'A-3. 관리자 - IR', description: 'IR 관리 API' },
      { name: 'A-4. 관리자 - 메인 팝업', description: '메인 팝업 관리 API' },
      { name: 'A-5. 관리자 - 주주총회', description: '주주총회 관리 API' },
      {
        name: 'A-6. 관리자 - 루미르스토리',
        description: '루미르스토리 관리 API',
      },
      {
        name: 'A-7. 관리자 - 비디오갤러리',
        description: '비디오갤러리 관리 API',
      },
      { name: 'A-8. 관리자 - 뉴스', description: '뉴스 관리 API' },
      { name: 'A-9. 관리자 - 공지사항', description: '공지사항 관리 API' },
      { name: 'A-10. 관리자 - Wiki', description: 'Wiki 관리 API' },
      { 
        name: '공통. 관리자 - 설문조사 (조회)', 
        description: '설문조사 조회 API (생성/수정/삭제는 공지사항을 통해 수행)' 
      },
      {
        name: '공통. 관리자 - 권한 검증',
        description: '권한 검증 배치 작업 수동 실행 API',
      },
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
