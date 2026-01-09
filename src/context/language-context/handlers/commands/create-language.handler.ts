import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '@domain/common/language/language.entity';
import { CreateLanguageDto, CreateLanguageResult } from '../../interfaces/language-context.interface';
import { Logger, ConflictException } from '@nestjs/common';

/**
 * 언어 생성 커맨드
 */
export class CreateLanguageCommand {
  constructor(public readonly data: CreateLanguageDto) {}
}

/**
 * 언어 생성 핸들러
 */
@CommandHandler(CreateLanguageCommand)
export class CreateLanguageHandler implements ICommandHandler<CreateLanguageCommand> {
  private readonly logger = new Logger(CreateLanguageHandler.name);

  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async execute(command: CreateLanguageCommand): Promise<CreateLanguageResult> {
    const { data } = command;

    this.logger.log(`언어 생성 시작 - 코드: ${data.code}, 이름: ${data.name}`);

    // 중복 체크
    const existing = await this.languageRepository.findOne({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException(`이미 존재하는 언어 코드입니다: ${data.code}`);
    }

    // 언어 생성
    const language = this.languageRepository.create(data);
    const saved = await this.languageRepository.save(language);

    this.logger.log(`언어 생성 완료 - ID: ${saved.id}`);

    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
