import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBrochureCommand } from './handlers/commands/create-brochure.handler';
import { UpdateBrochureCommand } from './handlers/commands/update-brochure.handler';
import { DeleteBrochureCommand } from './handlers/commands/delete-brochure.handler';
import { UpdateBrochurePublicCommand } from './handlers/commands/update-brochure-public.handler';
import {
  UpdateBrochureBatchOrderCommand,
  UpdateBrochureBatchOrderDto,
} from './handlers/commands/update-brochure-batch-order.handler';
import { UpdateBrochureFileCommand } from './handlers/commands/update-brochure-file.handler';
import { InitializeDefaultBrochuresCommand } from './handlers/commands/initialize-default-brochures.handler';
import {
  UpdateBrochureTranslationsCommand,
  UpdateBrochureTranslationsDto,
} from './handlers/commands/update-brochure-translations.handler';
import { GetBrochureListQuery } from './handlers/queries/get-brochure-list.handler';
import { GetBrochureDetailQuery } from './handlers/queries/get-brochure-detail.handler';
import {
  CreateBrochureDto,
  CreateBrochureResult,
  UpdateBrochureDto,
  UpdateBrochurePublicDto,
  UpdateBrochureOrderDto,
  UpdateBrochureFileDto,
  BrochureListResult,
  BrochureDetailResult,
} from './interfaces/brochure-context.interface';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';

/**
 * 브로슈어 컨텍스트 서비스
 *
 * 브로슈어 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class BrochureContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 브로슈어를 생성한다
   */
  async 브로슈어를_생성한다(
    data: CreateBrochureDto,
  ): Promise<CreateBrochureResult> {
    const command = new CreateBrochureCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 브로슈어를 수정한다
   */
  async 브로슈어를_수정한다(
    id: string,
    data: UpdateBrochureDto,
  ): Promise<Brochure> {
    const command = new UpdateBrochureCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 브로슈어를 삭제한다
   */
  async 브로슈어를_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteBrochureCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 브로슈어 공개를 수정한다
   */
  async 브로슈어_공개를_수정한다(
    id: string,
    data: UpdateBrochurePublicDto,
  ): Promise<Brochure> {
    const command = new UpdateBrochurePublicCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 브로슈어 오더를 일괄 수정한다
   */
  async 브로슈어_오더를_일괄_수정한다(
    data: UpdateBrochureBatchOrderDto,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const command = new UpdateBrochureBatchOrderCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 브로슈어 파일을 수정한다
   */
  async 브로슈어_파일을_수정한다(
    id: string,
    data: UpdateBrochureFileDto,
  ): Promise<Brochure> {
    const command = new UpdateBrochureFileCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 브로슈어 목록을 조회한다
   */
  async 브로슈어_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BrochureListResult> {
    const query = new GetBrochureListQuery(isPublic, orderBy, page, limit, startDate, endDate);
    return await this.queryBus.execute(query);
  }

  /**
   * 브로슈어 상세 조회한다
   */
  async 브로슈어_상세_조회한다(id: string): Promise<BrochureDetailResult> {
    const query = new GetBrochureDetailQuery(id);
    return await this.queryBus.execute(query);
  }

  /**
   * 기본 브로슈어들을 생성한다
   */
  async 기본_브로슈어들을_생성한다(createdBy?: string): Promise<Brochure[]> {
    const command = new InitializeDefaultBrochuresCommand(createdBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 기본 브로슈어들을 초기화한다 (일괄 제거)
   */
  async 기본_브로슈어들을_초기화한다(): Promise<number> {
    // system 사용자가 생성한 브로슈어들을 모두 삭제
    const listQuery = new GetBrochureListQuery(undefined, 'order', 1, 1000);
    const { items } = await this.queryBus.execute(listQuery);

    // system 사용자가 생성한 브로슈어만 필터링
    const systemBrochures = items.filter(
      (brochure) => brochure.createdBy === 'system',
    );

    // 일괄 삭제
    let deletedCount = 0;
    for (const brochure of systemBrochures) {
      const command = new DeleteBrochureCommand(brochure.id);
      const success = await this.commandBus.execute(command);
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 브로슈어 번역들을 수정한다
   */
  async 브로슈어_번역들을_수정한다(
    brochureId: string,
    data: UpdateBrochureTranslationsDto,
  ): Promise<BrochureTranslation[]> {
    const command = new UpdateBrochureTranslationsCommand(brochureId, data);
    return await this.commandBus.execute(command);
  }
}
