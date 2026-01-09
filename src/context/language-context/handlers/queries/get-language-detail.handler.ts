import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '@domain/common/language/language.entity';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 언어 상세 조회 쿼리
 */
export class GetLanguageDetailQuery {
  constructor(public readonly id: string) {}
}

/**
 * 언어 상세 조회 핸들러
 */
@QueryHandler(GetLanguageDetailQuery)
export class GetLanguageDetailHandler implements IQueryHandler<GetLanguageDetailQuery> {
  private readonly logger = new Logger(GetLanguageDetailHandler.name);

  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async execute(query: GetLanguageDetailQuery): Promise<Language> {
    const { id } = query;

    this.logger.debug(`언어 상세 조회 - ID: ${id}`);

    const language = await this.languageRepository.findOne({ where: { id } });

    if (!language) {
      throw new NotFoundException(`언어를 찾을 수 없습니다. ID: ${id}`);
    }

    return language;
  }
}
