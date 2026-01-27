import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '@domain/common/language/language.entity';
import {
  CreateLanguageDto,
  CreateLanguageResult,
} from '../../interfaces/language-context.interface';
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

    this.logger.log(`언어 추가 시작 - 코드: ${data.code}, 이름: ${data.name}`);

    // 제외된 언어 포함하여 중복 체크
    const existing = await this.languageRepository.findOne({
      where: { code: data.code },
      withDeleted: true, // soft deleted 언어도 조회
    });

    if (existing) {
      // 제외된 언어라면 복원
      if (existing.deletedAt) {
        this.logger.log(
          `제외된 언어를 복원합니다 - 코드: ${data.code}, ID: ${existing.id}`,
        );

        // 복원 및 데이터 업데이트
        existing.name = data.name;
        existing.isActive = data.isActive ?? true;
        existing.updatedBy = data.createdBy ?? null;

        // TypeORM의 recover 메서드 사용하여 soft delete 복원
        const restored = await this.languageRepository.recover(existing);

        this.logger.log(`언어 복원 완료 - ID: ${restored.id}`);

        return {
          id: restored.id,
          code: restored.code,
          name: restored.name,
          isActive: restored.isActive,
          createdAt: restored.createdAt,
          updatedAt: restored.updatedAt,
          createdBy: restored.createdBy,
          updatedBy: restored.updatedBy,
          deletedAt: restored.deletedAt,
        };
      }

      // 이미 활성 상태인 언어라면 오류
      throw new ConflictException(
        `이미 존재하는 언어 코드입니다: ${data.code}`,
      );
    }

    // 새 언어 생성
    const language = this.languageRepository.create({
      ...data,
      isActive: data.isActive ?? true, // 기본값 true 설정
    });
    const saved = await this.languageRepository.save(language);

    this.logger.log(`언어 생성 완료 - ID: ${saved.id}`);

    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      createdBy: saved.createdBy,
      updatedBy: saved.updatedBy,
      deletedAt: saved.deletedAt,
    };
  }
}
