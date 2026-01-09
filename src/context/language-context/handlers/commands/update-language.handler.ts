import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '@domain/common/language/language.entity';
import { UpdateLanguageDto } from '../../interfaces/language-context.interface';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 언어 수정 커맨드
 */
export class UpdateLanguageCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateLanguageDto,
  ) {}
}

/**
 * 언어 수정 핸들러
 */
@CommandHandler(UpdateLanguageCommand)
export class UpdateLanguageHandler implements ICommandHandler<UpdateLanguageCommand> {
  private readonly logger = new Logger(UpdateLanguageHandler.name);

  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async execute(command: UpdateLanguageCommand): Promise<Language> {
    const { id, data } = command;

    this.logger.log(`언어 수정 시작 - ID: ${id}`);

    // 언어 조회
    const language = await this.languageRepository.findOne({ where: { id } });

    if (!language) {
      throw new NotFoundException(`언어를 찾을 수 없습니다. ID: ${id}`);
    }

    // 업데이트
    if (data.name !== undefined) {
      language.name = data.name;
    }
    if (data.isActive !== undefined) {
      language.isActive = data.isActive;
    }
    if (data.updatedBy) {
      language.updatedBy = data.updatedBy;
    }

    const updated = await this.languageRepository.save(language);

    this.logger.log(`언어 수정 완료 - ID: ${id}`);

    return updated;
  }
}
