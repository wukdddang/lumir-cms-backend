import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@libs/database/database.module';
import { LanguageInterfaceModule } from './interface/admin/language/language.module';
import { BrochureInterfaceModule } from './interface/admin/brochure/brochure.module';

/**
 * 루미르 CMS 애플리케이션 모듈
 *
 * @description
 * - 모든 Interface Layer 모듈을 등록합니다.
 * - Interface Layer는 Business Layer와 Context Layer를 자동으로 import합니다.
 * - TypeORM을 통해 PostgreSQL 데이터베이스와 연결합니다.
 */
@Module({
  imports: [
    // 환경 변수 설정 (전역)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 데이터베이스 모듈
    DatabaseModule,

    // Interface Layer 모듈
    LanguageInterfaceModule,
    BrochureInterfaceModule,
  ],
})
export class AppModule {}
