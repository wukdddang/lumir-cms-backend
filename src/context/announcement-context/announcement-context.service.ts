import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAnnouncementCommand } from './handlers/commands/create-announcement.handler';
import { UpdateAnnouncementCommand } from './handlers/commands/update-announcement.handler';
import { UpdateAnnouncementPublicCommand } from './handlers/commands/update-announcement-public.handler';
import { UpdateAnnouncementFixedCommand } from './handlers/commands/update-announcement-fixed.handler';
import { UpdateAnnouncementOrderCommand } from './handlers/commands/update-announcement-order.handler';
import { UpdateAnnouncementBatchOrderCommand } from './handlers/commands/update-announcement-batch-order.handler';
import { DeleteAnnouncementCommand } from './handlers/commands/delete-announcement.handler';
import { GetAnnouncementListQuery } from './handlers/queries/get-announcement-list.handler';
import { GetAnnouncementDetailQuery } from './handlers/queries/get-announcement-detail.handler';
import {
  CreateAnnouncementDto,
  CreateAnnouncementResult,
  UpdateAnnouncementDto,
  UpdateAnnouncementPublicDto,
  UpdateAnnouncementFixedDto,
  UpdateAnnouncementOrderDto,
  UpdateAnnouncementBatchOrderDto,
  AnnouncementListResult,
  AnnouncementDetailResult,
} from './interfaces/announcement-context.interface';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { ContentStatus } from '@domain/core/content-status.types';

/**
 * 공지사항 컨텍스트 서비스
 *
 * 공지사항 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class AnnouncementContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 공지사항을 생성한다
   */
  async 공지사항을_생성한다(
    data: CreateAnnouncementDto,
  ): Promise<CreateAnnouncementResult> {
    const command = new CreateAnnouncementCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 공지사항을 수정한다
   */
  async 공지사항을_수정한다(
    id: string,
    data: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const command = new UpdateAnnouncementCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 공지사항_공개를_수정한다
   */
  async 공지사항_공개를_수정한다(
    id: string,
    data: UpdateAnnouncementPublicDto,
  ): Promise<Announcement> {
    const command = new UpdateAnnouncementPublicCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 공지사항_고정을_수정한다
   */
  async 공지사항_고정을_수정한다(
    id: string,
    data: UpdateAnnouncementFixedDto,
  ): Promise<Announcement> {
    const command = new UpdateAnnouncementFixedCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 공지사항_오더를_수정한다
   */
  async 공지사항_오더를_수정한다(
    id: string,
    data: UpdateAnnouncementOrderDto,
  ): Promise<Announcement> {
    const command = new UpdateAnnouncementOrderCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 공지사항_오더를_일괄_수정한다
   */
  async 공지사항_오더를_일괄_수정한다(
    data: UpdateAnnouncementBatchOrderDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const command = new UpdateAnnouncementBatchOrderCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 공지사항을 삭제한다
   */
  async 공지사항을_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteAnnouncementCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 공지사항 목록을 조회한다
   */
  async 공지사항_목록을_조회한다(params: {
    isPublic?: boolean;
    isFixed?: boolean;
    status?: ContentStatus;
    orderBy?: 'order' | 'createdAt';
    page?: number;
    limit?: number;
  }): Promise<AnnouncementListResult> {
    const query = new GetAnnouncementListQuery(
      params.isPublic,
      params.isFixed,
      params.status,
      params.orderBy || 'order',
      params.page || 1,
      params.limit || 10,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 공지사항을 조회한다
   */
  async 공지사항을_조회한다(id: string): Promise<AnnouncementDetailResult> {
    const query = new GetAnnouncementDetailQuery(id);
    return await this.queryBus.execute(query);
  }
}
