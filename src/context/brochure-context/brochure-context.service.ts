import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBrochureCommand } from './handlers/commands/create-brochure.handler';
import { UpdateBrochureCommand } from './handlers/commands/update-brochure.handler';
import { DeleteBrochureCommand } from './handlers/commands/delete-brochure.handler';
import { UpdateBrochurePublicCommand } from './handlers/commands/update-brochure-public.handler';
import { UpdateBrochureOrderCommand } from './handlers/commands/update-brochure-order.handler';
import { UpdateBrochureFileCommand } from './handlers/commands/update-brochure-file.handler';
import { InitializeDefaultBrochuresCommand } from './handlers/commands/initialize-default-brochures.handler';
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
   * 브로슈어 오더를 수정한다
   */
  async 브로슈어_오더를_수정한다(
    id: string,
    data: UpdateBrochureOrderDto,
  ): Promise<Brochure> {
    const command = new UpdateBrochureOrderCommand(id, data);
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
  ): Promise<BrochureListResult> {
    const query = new GetBrochureListQuery(isPublic, orderBy, page, limit);
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
   * 기본 브로슈어들을 추가한다
   */
  async 기본_브로슈어들을_추가한다(createdBy?: string): Promise<Brochure[]> {
    const command = new InitializeDefaultBrochuresCommand(createdBy);
    return await this.commandBus.execute(command);
  }
}
