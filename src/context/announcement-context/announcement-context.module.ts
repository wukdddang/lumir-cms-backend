import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementContextService } from './announcement-context.service';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { AnnouncementPermissionLog } from '@domain/core/announcement/announcement-permission-log.entity';
import { AnnouncementModule } from '@domain/core/announcement/announcement.module';
import { AnnouncementPermissionScheduler } from './announcement-permission.scheduler';
import {
  GetAnnouncementListHandler,
  GetAnnouncementDetailHandler,
  CreateAnnouncementHandler,
  UpdateAnnouncementHandler,
  UpdateAnnouncementPublicHandler,
  UpdateAnnouncementFixedHandler,
  UpdateAnnouncementOrderHandler,
  UpdateAnnouncementBatchOrderHandler,
  DeleteAnnouncementHandler,
} from './handlers';
import { SsoModule } from '@domain/common/sso/sso.module';

const QueryHandlers = [
  GetAnnouncementListHandler,
  GetAnnouncementDetailHandler,
];

const CommandHandlers = [
  CreateAnnouncementHandler,
  UpdateAnnouncementHandler,
  UpdateAnnouncementPublicHandler,
  UpdateAnnouncementFixedHandler,
  UpdateAnnouncementOrderHandler,
  UpdateAnnouncementBatchOrderHandler,
  DeleteAnnouncementHandler,
];

/**
 * 공지사항 컨텍스트 모듈
 *
 * 공지사항 관련 비즈니스 로직을 담당합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Announcement, AnnouncementPermissionLog]),
    AnnouncementModule,
    SsoModule,
  ],
  providers: [
    AnnouncementContextService,
    AnnouncementPermissionScheduler,
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [AnnouncementContextService, AnnouncementPermissionScheduler],
})
export class AnnouncementContextModule {}
