import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementPopup } from '@domain/core/announcement-popup/announcement-popup.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { AnnouncementPopupService } from './announcement-popup.service';

/**
 * 공지사항 팝업 비즈니스 모듈
 *
 * @description
 * - 공지사항 팝업 관련 비즈니스 서비스를 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AnnouncementPopup, Employee])],
  providers: [AnnouncementPopupService],
  exports: [AnnouncementPopupService],
})
export class AnnouncementPopupBusinessModule {}
