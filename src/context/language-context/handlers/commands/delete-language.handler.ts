import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '@domain/common/language/language.entity';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 언어 삭제 커맨드
 */
export class DeleteLanguageCommand {
  constructor(public readonly id: string) {}
}

/**
 * 언어 삭제 핸들러
 */
@CommandHandler(DeleteLanguageCommand)
export class DeleteLanguageHandler implements ICommandHandler<DeleteLanguageCommand> {
  private readonly logger = new Logger(DeleteLanguageHandler.name);

  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async execute(command: DeleteLanguageCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`언어 삭제 시작 - ID: ${id}`);

    // 언어 조회
    const language = await this.languageRepository.findOne({ where: { id } });

    if (!language) {
      throw new NotFoundException(`언어를 찾을 수 없습니다. ID: ${id}`);
    }

    // Soft Delete
    await this.languageRepository.softRemove(language);

    this.logger.log(`언어 삭제 완료 - ID: ${id}`);

    return true;
  }
}
