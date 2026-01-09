import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLanguageCommand } from './handlers/commands/create-language.handler';
import { UpdateLanguageCommand } from './handlers/commands/update-language.handler';
import { DeleteLanguageCommand } from './handlers/commands/delete-language.handler';
import { InitializeDefaultLanguagesCommand } from './handlers/commands/initialize-default-languages.handler';
import { GetLanguageListQuery } from './handlers/queries/get-language-list.handler';
import { GetLanguageDetailQuery } from './handlers/queries/get-language-detail.handler';
import {
  CreateLanguageDto,
  CreateLanguageResult,
  UpdateLanguageDto,
  LanguageListResult,
} from './interfaces/language-context.interface';
import { Language } from '@domain/common/language/language.entity';

/**
 * 언어 컨텍스트 서비스
 *
 * 언어 생성, 수정, 삭제 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class LanguageContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 언어를 생성한다
   */
  async 언어를_생성한다(
    data: CreateLanguageDto,
  ): Promise<CreateLanguageResult> {
    const command = new CreateLanguageCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * 언어를 수정한다
   */
  async 언어를_수정한다(
    id: string,
    data: UpdateLanguageDto,
  ): Promise<Language> {
    const command = new UpdateLanguageCommand(id, data);
    return await this.commandBus.execute(command);
  }

  /**
   * 언어를 삭제한다
   */
  async 언어를_삭제한다(id: string): Promise<boolean> {
    const command = new DeleteLanguageCommand(id);
    return await this.commandBus.execute(command);
  }

  /**
   * 언어 목록을 조회한다
   */
  async 언어_목록을_조회한다(
    includeInactive: boolean = false,
  ): Promise<LanguageListResult> {
    const query = new GetLanguageListQuery(includeInactive);
    return await this.queryBus.execute(query);
  }

  /**
   * 언어 상세를 조회한다
   */
  async 언어_상세를_조회한다(id: string): Promise<Language> {
    const query = new GetLanguageDetailQuery(id);
    return await this.queryBus.execute(query);
  }

  /**
   * 기본 언어들을 추가한다
   */
  async 기본_언어들을_추가한다(createdBy?: string): Promise<Language[]> {
    const command = new InitializeDefaultLanguagesCommand(createdBy);
    return await this.commandBus.execute(command);
  }
}
