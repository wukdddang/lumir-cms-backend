import { Module } from '@nestjs/common';
import { AnnouncementModule } from './announcement/announcement.module';
import { NewsModule } from './news/news.module';
import { ShareholdersMeetingModule } from './shareholders-meeting/shareholders-meeting.module';
import { ElectronicDisclosureModule } from './electronic-disclosure/electronic-disclosure.module';
import { IRModule } from './ir/ir.module';
import { BrochureModule } from './brochure/brochure.module';

/**
 * Core Domain 통합 모듈
 * 핵심 비즈니스 도메인의 모든 모듈을 통합합니다.
 */
@Module({
  imports: [
    AnnouncementModule,
    NewsModule,
    ShareholdersMeetingModule,
    ElectronicDisclosureModule,
    IRModule,
    BrochureModule,
  ],
  exports: [
    AnnouncementModule,
    NewsModule,
    ShareholdersMeetingModule,
    ElectronicDisclosureModule,
    IRModule,
    BrochureModule,
  ],
})
export class CoreDomainModule {}
