import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import {
  CreateBrochureDto,
  CreateBrochureResult,
} from '../../interfaces/brochure-context.interface';
import { Logger, BadRequestException } from '@nestjs/common';

/**
 * 브로슈어 생성 커맨드
 */
export class CreateBrochureCommand {
  constructor(public readonly data: CreateBrochureDto) {}
}

/**
 * 브로슈어 생성 핸들러
 */
@CommandHandler(CreateBrochureCommand)
export class CreateBrochureHandler implements ICommandHandler<CreateBrochureCommand> {
  private readonly logger = new Logger(CreateBrochureHandler.name);

  constructor(
    private readonly brochureService: BrochureService,
    private readonly languageService: LanguageService,
    private readonly configService: ConfigService,
    @InjectRepository(BrochureTranslation)
    private readonly brochureTranslationRepository: Repository<BrochureTranslation>,
  ) {}

  async execute(command: CreateBrochureCommand): Promise<CreateBrochureResult> {
    const { data } = command;

    this.logger.log(
      `브로슈어 생성 시작 - 번역 수: ${data.translations.length}`,
    );

    // categoryId 필수 검증
    if (!data.categoryId) {
      throw new BadRequestException('categoryId는 필수입니다.');
    }

    // 각 translation 필수 필드 검증
    for (const translation of data.translations) {
      if (!translation.languageId) {
        throw new BadRequestException('languageId는 필수입니다.');
      }
      if (!translation.title) {
        throw new BadRequestException('title은 필수입니다.');
      }
    }

    // 모든 언어 ID 검증
    const languageIds = data.translations.map((t) => t.languageId);
    const languages = await Promise.all(
      languageIds.map((id) => this.languageService.ID로_언어를_조회한다(id)),
    );

    // 중복 언어 체크
    const uniqueLanguageIds = new Set(languageIds);
    if (uniqueLanguageIds.size !== languageIds.length) {
      throw new BadRequestException('중복된 언어 ID가 있습니다.');
    }

    // 모든 활성 언어 조회 (동기화용)
    const allLanguages = await this.languageService.모든_언어를_조회한다(false);

    // 자동으로 order 계산
    const nextOrder = await this.brochureService.다음_순서를_계산한다();

    // 브로슈어 생성 (기본값: 공개)
    const saved = await this.brochureService.브로슈어를_생성한다({
      isPublic: true, // 기본값: 공개
      order: nextOrder, // 자동 계산
      categoryId: data.categoryId, // 필수
      attachments: data.attachments || null,
      createdBy: data.createdBy,
      updatedBy: data.createdBy, // 생성 시점이므로 createdBy와 동일
    });

    // 전달받은 언어들에 대한 번역 생성 (isSynced: false, 개별 설정됨)
    const customTranslations = data.translations.map((trans) =>
      this.brochureTranslationRepository.create({
        brochureId: saved.id,
        languageId: trans.languageId,
        title: trans.title,
        description: trans.description || null,
        isSynced: false, // 개별 설정되었으므로 동기화 비활성화
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      }),
    );

    await this.brochureTranslationRepository.save(customTranslations);

    // 첫 번째 번역 찾기 (기본 언어 우선, 없으면 첫 번째)
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    const defaultLang = languages.find((l) => l.code === defaultLanguageCode);
    const baseTranslation =
      data.translations.find((t) => t.languageId === defaultLang?.id) ||
      data.translations[0];

    // 전달되지 않은 나머지 활성 언어들에 대한 번역 생성 (isSynced: true, 자동 동기화)
    const remainingLanguages = allLanguages.filter(
      (lang) => !languageIds.includes(lang.id),
    );

    if (remainingLanguages.length > 0) {
      const syncedTranslations = remainingLanguages.map((lang) =>
        this.brochureTranslationRepository.create({
          brochureId: saved.id,
          languageId: lang.id,
          title: baseTranslation.title, // 기준 번역의 제목 사용
          description: baseTranslation.description || null,
          isSynced: true, // 자동 동기화 활성화
          createdBy: data.createdBy,
          updatedBy: data.createdBy,
        }),
      );

      await this.brochureTranslationRepository.save(syncedTranslations);
    }

    const totalTranslations =
      customTranslations.length + remainingLanguages.length;

    this.logger.log(
      `브로슈어 생성 완료 - ID: ${saved.id}, Order: ${saved.order}, 전체 번역 수: ${totalTranslations} (개별 설정: ${customTranslations.length}, 자동 동기화: ${remainingLanguages.length})`,
    );

    return {
      id: saved.id,
      isPublic: saved.isPublic,
      order: saved.order,
      createdAt: saved.createdAt,
    };
  }
}
