import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectronicDisclosureService } from '@domain/core/electronic-disclosure/electronic-disclosure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';

/**
 * 전자공시 번역 동기화 핸들러
 *
 * isSynced가 true인 번역들을 한국어 원본과 동기화합니다.
 * 1분마다 실행됩니다.
 */
@Injectable()
export class SyncElectronicDisclosureTranslationsHandler {
  private readonly logger = new Logger(
    SyncElectronicDisclosureTranslationsHandler.name,
  );

  constructor(
    private readonly electronicDisclosureService: ElectronicDisclosureService,
    private readonly languageService: LanguageService,
    @InjectRepository(ElectronicDisclosureTranslation)
    private readonly translationRepository: Repository<ElectronicDisclosureTranslation>,
  ) {}

  /**
   * 전자공시 번역 동기화 작업 실행
   */
  async execute(): Promise<void> {
    this.logger.log('전자공시 번역 동기화 작업 시작');

    try {
      // 한국어 조회
      const koreanLanguage = await this.languageService.코드로_언어를_조회한다(
        'ko' as any,
      );

      if (!koreanLanguage) {
        this.logger.warn(
          '한국어 언어를 찾을 수 없습니다. 동기화를 건너뜁니다.',
        );
        return;
      }

      // 모든 전자공시 조회
      const disclosures =
        await this.electronicDisclosureService.모든_전자공시를_조회한다();

      let totalSyncedCount = 0;

      for (const disclosure of disclosures) {
        // 한국어 원본 번역 조회
        const koreanTranslation = await this.translationRepository.findOne({
          where: {
            electronicDisclosureId: disclosure.id,
            languageId: koreanLanguage.id,
          },
        });

        if (!koreanTranslation) {
          this.logger.warn(
            `한국어 번역을 찾을 수 없습니다 - 전자공시 ID: ${disclosure.id}`,
          );
          continue;
        }

        // isSynced가 true인 다른 언어 번역들 조회
        const syncedTranslations = await this.translationRepository.find({
          where: {
            electronicDisclosureId: disclosure.id,
            isSynced: true,
          },
        });

        // 한국어를 제외한 동기화 대상 번역들
        const translationsToSync = syncedTranslations.filter(
          (t) => t.languageId !== koreanLanguage.id,
        );

        if (translationsToSync.length === 0) {
          continue;
        }

        // 한국어 원본과 동기화
        for (const translation of translationsToSync) {
          translation.title = koreanTranslation.title;
          translation.description = koreanTranslation.description;
          await this.translationRepository.save(translation);
          totalSyncedCount++;
        }

        this.logger.debug(
          `전자공시 동기화 완료 - ID: ${disclosure.id}, 동기화된 번역 수: ${translationsToSync.length}`,
        );
      }

      this.logger.log(
        `전자공시 번역 동기화 작업 완료 - 총 동기화된 번역 수: ${totalSyncedCount}`,
      );
    } catch (error) {
      this.logger.error('전자공시 번역 동기화 작업 실패', error);
    }
  }
}
