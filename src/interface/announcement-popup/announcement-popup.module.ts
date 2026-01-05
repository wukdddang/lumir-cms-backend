import { Module } from '@nestjs/common';
import { AnnouncementPopupBusinessModule } from '@business/announcement-popup/announcement-popup.module';
import { AnnouncementPopupController } from './announcement-popup.controller';

/**
 * 공지사항 팝업 인터페이스 모듈
 */
@Module({
  imports: [AnnouncementPopupBusinessModule],
  controllers: [AnnouncementPopupController],
})
export class AnnouncementPopupInterfaceModule {}
