import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '@libs/database/database.module';
import { AuthInterfaceModule } from './interface/admin/auth/auth.module';
import { LanguageInterfaceModule } from './interface/admin/language/language.module';
import { BrochureInterfaceModule } from './interface/admin/brochure/brochure.module';
import { ElectronicDisclosureInterfaceModule } from './interface/admin/electronic-disclosure/electronic-disclosure.module';
import { IRInterfaceModule } from './interface/admin/ir/ir.module';
import { MainPopupInterfaceModule } from './interface/admin/main-popup/main-popup.module';
import { ShareholdersMeetingAdminModule } from './interface/admin/shareholders-meeting/shareholders-meeting.module';
import { AdminLumirStoryModule } from './interface/admin/lumir-story/lumir-story.module';
import { AdminVideoGalleryModule } from './interface/admin/video-gallery/video-gallery.module';
import { AdminNewsModule } from './interface/admin/news/news.module';
import { AnnouncementModule } from './interface/admin/announcement/announcement.module';
import { WikiModule } from './interface/admin/wiki/wiki.module';
import { SeedDataModule } from './interface/admin/seed-data/seed-data.module';
import { PermissionValidationModule } from './interface/admin/permission-validation/permission-validation.module';
import { HealthModule } from './interface/common/health/health.module';
import { CompanyModule } from './interface/common/company/company.module';
import { AuthContextModule } from '@context/auth-context';
import { JwtAuthGuard } from '@interface/common/guards/jwt-auth.guard';

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

    // 스케줄러 모듈 (전역)
    ScheduleModule.forRoot(),

    // 데이터베이스 모듈
    DatabaseModule,

    // Context Layer 모듈
    AuthContextModule,

    // Interface Layer 모듈
    HealthModule,
    AuthInterfaceModule,
    LanguageInterfaceModule,
    BrochureInterfaceModule,
    ElectronicDisclosureInterfaceModule,
    IRInterfaceModule,
    MainPopupInterfaceModule,
    ShareholdersMeetingAdminModule,
    AdminLumirStoryModule,
    AdminVideoGalleryModule,
    AdminNewsModule,
    AnnouncementModule,
    WikiModule,
    SeedDataModule,
    PermissionValidationModule,
    CompanyModule,
  ],
  providers: [
    // 전역 JWT 인증 가드 설정
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
