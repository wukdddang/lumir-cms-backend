import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { Logger, NotFoundException } from '@nestjs/common';
import { BrochureTranslationUpdatedEvent } from '../../events/brochure-translation-updated.event';
import { LanguageService } from '@domain/common/language/language.service';

/**
 * 브로슈어 번역 수정 DTO
 */
export interface UpdateBrochureTranslationItemDto {
  languageId: string;
  title: string;
  description?: string | null;
}

export interface UpdateBrochureTranslationsDto {
  translations: UpdateBrochureTranslationItemDto[];
  updatedBy?: string;
}

/**
 * 브로슈어 번역들 수정 커맨드
 */
export class UpdateBrochureTranslationsCommand {
  constructor(
    public readonly brochureId: string,
    public readonly data: UpdateBrochureTranslationsDto,
  ) {}
}

/**
 * 브로슈어 번역들 수정 핸들러
 *
 * 개별 언어별로 번역을 수정하면 해당 언어의 isSynced가 false로 설정되어
 * 자동 동기화에서 제외됩니다.
 */
@CommandHandler(UpdateBrochureTranslationsCommand)
export class UpdateBrochureTranslationsHandler
  implements ICommandHandler<UpdateBrochureTranslationsCommand>
{
  private readonly logger = new Logger(UpdateBrochureTranslationsHandler.name);

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
    @InjectRepository(BrochureTranslation)
    private readonly brochureTranslationRepository: Repository<BrochureTranslation>,
    private readonly eventBus: EventBus,
    private readonly languageService: LanguageService,
  ) {}

  async execute(
    command: UpdateBrochureTranslationsCommand,
  ): Promise<BrochureTranslation[]> {
    const { brochureId, data } = command;

    this.logger.log(
      `브로슈어 번역 수정 시작 - 브로슈어 ID: ${brochureId}, 번역 수: ${data.translations.length}`,
    );

    // 브로슈어 존재 확인
    const brochure = await this.brochureRepository.findOne({
      where: { id: brochureId },
    });

    if (!brochure) {
      throw new NotFoundException(
        `브로슈어를 찾을 수 없습니다. ID: ${brochureId}`,
      );
    }

    // 브로슈어 updatedBy 업데이트
    if (data.updatedBy) {
      brochure.updatedBy = data.updatedBy;
      await this.brochureRepository.save(brochure);
    }

    // 기본 언어 조회
    const baseLanguage = await this.languageService.기본_언어를_조회한다();

    const updatedTranslations: BrochureTranslation[] = [];

    // 각 번역 업데이트 (isSynced를 false로 설정하여 동기화 중단)
    for (const translationData of data.translations) {
      const translation = await this.brochureTranslationRepository.findOne({
        where: {
          brochureId,
          languageId: translationData.languageId,
        },
      });

      if (translation) {
        translation.title = translationData.title;
        translation.description = translationData.description || null;
        translation.isSynced = false; // 개별 수정되었으므로 동기화 중단
        translation.updatedBy = data.updatedBy || translation.updatedBy;

        const saved =
          await this.brochureTranslationRepository.save(translation);
        updatedTranslations.push(saved);

        this.logger.log(
          `번역 수정 완료 - 언어 ID: ${translationData.languageId}, isSynced: false`,
        );

        // 기본 언어 번역이 수정된 경우 이벤트 발행 (동기화 트리거)
        if (baseLanguage && translationData.languageId === baseLanguage.id) {
          this.logger.debug(
            `기본 언어 번역 수정 감지 - 동기화 이벤트 발행`,
          );
          this.eventBus.publish(
            new BrochureTranslationUpdatedEvent(
              brochureId,
              translationData.languageId,
              translationData.title,
              translationData.description || null,
              data.updatedBy,
            ),
          );
        }
      } else {
        this.logger.warn(
          `번역을 찾을 수 없습니다 - 브로슈어 ID: ${brochureId}, 언어 ID: ${translationData.languageId}`,
        );
      }
    }

    this.logger.log(
      `브로슈어 번역 수정 완료 - 브로슈어 ID: ${brochureId}, 수정된 번역 수: ${updatedTranslations.length}`,
    );

    return updatedTranslations;
  }
}
