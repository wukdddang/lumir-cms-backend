import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLumirStoryCommand } from './handlers/commands/create-lumir-story.handler';
import { UpdateLumirStoryCommand } from './handlers/commands/update-lumir-story.handler';
import { DeleteLumirStoryCommand } from './handlers/commands/delete-lumir-story.handler';
import { UpdateLumirStoryPublicCommand } from './handlers/commands/update-lumir-story-public.handler';
import {
  UpdateLumirStoryBatchOrderCommand,
  UpdateLumirStoryBatchOrderDto,
} from './handlers/commands/update-lumir-story-batch-order.handler';
import { UpdateLumirStoryFileCommand } from './handlers/commands/update-lumir-story-file.handler';
import { GetLumirStoryListQuery } from './handlers/queries/get-lumir-story-list.handler';
import { GetLumirStoryDetailQuery } from './handlers/queries/get-lumir-story-detail.handler';
import {
  CreateLumirStoryDto,
  CreateLumirStoryResult,
  UpdateLumirStoryDto,
  UpdateLumirStoryPublicDto,
  UpdateLumirStoryFileDto,
  LumirStoryListResult,
  LumirStoryDetailResult,
} from './interfaces/lumir-story-context.interface';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';

/**
 * 루미르스토리 컨텍스트 서비스
 *
 * 루미르스토리 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class LumirStoryContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 루미르스토리를 생성한다
   */
  async 루미르스토리를_생성한다(
    data: CreateLumirStoryDto,
  ): Promise<CreateLumirStoryResult> {
    const command = new CreateLumirStoryCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 루미르스토리를 수정한다
   */
  async 루미르스토리를_수정한다(
    id: string,
    data: UpdateLumirStoryDto,
  ): Promise<LumirStory> {
    const command = new UpdateLumirStoryCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 루미르스토리를 삭제한다
   */
  async 루미르스토리를_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteLumirStoryCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 루미르스토리 공개를 수정한다
   */
  async 루미르스토리_공개를_수정한다(
    id: string,
    data: UpdateLumirStoryPublicDto,
  ): Promise<LumirStory> {
    const command = new UpdateLumirStoryPublicCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 루미르스토리 오더를 일괄 수정한다
   */
  async 루미르스토리_오더를_일괄_수정한다(
    data: UpdateLumirStoryBatchOrderDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const command = new UpdateLumirStoryBatchOrderCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 루미르스토리 파일을 수정한다
   */
  async 루미르스토리_파일을_수정한다(
    id: string,
    data: UpdateLumirStoryFileDto,
  ): Promise<LumirStory> {
    const command = new UpdateLumirStoryFileCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 루미르스토리 목록을 조회한다
   */
  async 루미르스토리_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<LumirStoryListResult> {
    const query = new GetLumirStoryListQuery(isPublic, orderBy, page, limit, startDate, endDate);
    return await this.queryBus.execute(query);
  }

  /**
   * 루미르스토리 상세 조회한다
   */
  async 루미르스토리_상세_조회한다(
    id: string,
  ): Promise<LumirStoryDetailResult> {
    const query = new GetLumirStoryDetailQuery(id);
    return await this.queryBus.execute(query);
  }
}
