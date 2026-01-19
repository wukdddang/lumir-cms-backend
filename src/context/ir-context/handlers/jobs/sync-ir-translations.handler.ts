import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRService } from '@domain/core/ir/ir.service';
import { LanguageService } from '@domain/common/language/language.service';
import { IRTranslation } from '@domain/core/ir/ir-translation.entity';

/**
 * IR 번역 동기화 핸들러
 *
 * isSynced가 true인 번역들을 한국어 원본과 동기화합니다.
 * 1분마다 실행됩니다.
 */
@Injectable()
export class SyncIRTranslationsHandler {
  private readonly logger = new Logger(SyncIRTranslationsHandler.name);

  constructor(
    private readonly irService: IRService,
    private readonly languageService: LanguageService,
    @InjectRepository(IRTranslation)
    private readonly translationRepository: Repository<IRTranslation>,
  ) {}

  /**
   * IR 번역 동기화 작업 실행
   */
  async execute(): Promise<void> {
    this.logger.log('IR 번역 동기화 작업 시작');

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

      // 모든 IR 조회
      const irs = await this.irService.모든_IR을_조회한다();

      let totalSyncedCount = 0;

      for (const ir of irs) {
        // 한국어 원본 번역 조회
        const koreanTranslation = await this.translationRepository.findOne({
          where: {
            irId: ir.id,
            languageId: koreanLanguage.id,
          },
        });

        if (!koreanTranslation) {
          this.logger.warn(
            `한국어 번역을 찾을 수 없습니다 - IR ID: ${ir.id}`,
          );
          continue;
        }

        // isSynced가 true인 다른 언어 번역들 조회
        const syncedTranslations = await this.translationRepository.find({
          where: {
            irId: ir.id,
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
          `IR 동기화 완료 - ID: ${ir.id}, 동기화된 번역 수: ${translationsToSync.length}`,
        );
      }

      this.logger.log(
        `IR 번역 동기화 작업 완료 - 총 동기화된 번역 수: ${totalSyncedCount}`,
      );
    } catch (error) {
      this.logger.error('IR 번역 동기화 작업 실패', error);
    }
  }
}
