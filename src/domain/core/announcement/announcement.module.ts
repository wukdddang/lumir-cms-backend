import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from './announcement.entity';
import { AnnouncementRead } from './announcement-read.entity';
import { AnnouncementPermissionLog } from './announcement-permission-log.entity';
import { AnnouncementService } from './announcement.service';

/**
 * 공지사항 모듈
 * 내부 공지사항 관리 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Announcement, AnnouncementRead, AnnouncementPermissionLog])],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
