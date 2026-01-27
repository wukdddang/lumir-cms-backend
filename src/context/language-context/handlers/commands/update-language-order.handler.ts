import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '@domain/common/language/language.entity';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 언어 순서 변경 커맨드
 */
export class UpdateLanguageOrderCommand {
  constructor(
    public readonly id: string,
    public readonly data: { order: number; updatedBy: string },
  ) {}
}

/**
 * 언어 순서 변경 핸들러
 */
@CommandHandler(UpdateLanguageOrderCommand)
export class UpdateLanguageOrderHandler
  implements ICommandHandler<UpdateLanguageOrderCommand>
{
  private readonly logger = new Logger(UpdateLanguageOrderHandler.name);

  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async execute(command: UpdateLanguageOrderCommand): Promise<Language> {
    const { id, data } = command;

    this.logger.log(`언어 순서 변경 시작 - ID: ${id}, 순서: ${data.order}`);

    // 언어 조회
    const language = await this.languageRepository.findOne({
      where: { id },
    });

    if (!language) {
      throw new NotFoundException(`언어를 찾을 수 없습니다. ID: ${id}`);
    }

    // 순서 변경
    language.order = data.order;
    language.updatedBy = data.updatedBy;

    const updated = await this.languageRepository.save(language);

    this.logger.log(`언어 순서 변경 완료 - ID: ${id}, 이름: ${language.name}, 순서: ${data.order}`);

    return updated;
  }
}
