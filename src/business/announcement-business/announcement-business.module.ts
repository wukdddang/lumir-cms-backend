import { Module } from '@nestjs/common';
import { AnnouncementBusinessService } from './announcement-business.service';
import { AnnouncementContextModule } from '@context/announcement-context/announcement-context.module';
import { CompanyContextModule } from '@context/company-context/company-context.module';
import { CategoryModule } from '@domain/common/category/category.module';

/**
 * 공지사항 비즈니스 모듈
 *
 * 공지사항 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Module({
  imports: [AnnouncementContextModule, CompanyContextModule, CategoryModule],
  providers: [AnnouncementBusinessService],
  exports: [AnnouncementBusinessService],
})
export class AnnouncementBusinessModule {}
