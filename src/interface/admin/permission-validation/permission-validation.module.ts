import { Module } from '@nestjs/common';
import { PermissionValidationController } from './permission-validation.controller';
import { AnnouncementContextModule } from '@context/announcement-context/announcement-context.module';
import { WikiContextModule } from '@context/wiki-context/wiki-context.module';

/**
 * 권한 검증 관리자 모듈
 * 
 * 수동으로 권한 검증 배치 작업을 실행할 수 있는 API를 제공합니다.
 */
@Module({
  imports: [
    AnnouncementContextModule,
    WikiContextModule,
  ],
  controllers: [PermissionValidationController],
})
export class PermissionValidationModule {}
