import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Language } from '@domain/common/language/language.entity';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';

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
    private readonly configService: ConfigService,
  ) {}

  async execute(command: DeleteLanguageCommand): Promise<boolean> {
    const { id } = command;

    this.logger.log(`언어 삭제 시작 - ID: ${id}`);

    // 언어 조회
    const language = await this.languageRepository.findOne({ where: { id } });

    if (!language) {
      throw new NotFoundException(`언어를 찾을 수 없습니다. ID: ${id}`);
    }

    // 기본 언어 삭제 방지
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    if (language.code === defaultLanguageCode) {
      this.logger.warn(
        `기본 언어 삭제 시도 차단 - ${language.name} (${language.code})`,
      );
      throw new BadRequestException(
        `기본 언어(${language.name})는 삭제할 수 없습니다. 시스템 운영에 필수적인 언어입니다.`,
      );
    }

    // Soft Delete
    await this.languageRepository.softRemove(language);

    this.logger.log(`언어 삭제 완료 - ID: ${id}, 이름: ${language.name}`);

    return true;
  }
}
