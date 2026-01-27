import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncBrochureTranslationsHandler } from '@context/brochure-context/handlers/jobs/sync-brochure-translations.handler';
import { SyncElectronicDisclosureTranslationsHandler } from '@context/electronic-disclosure-context/handlers/jobs/sync-electronic-disclosure-translations.handler';
import { SyncIRTranslationsHandler } from '@context/ir-context/handlers/jobs/sync-ir-translations.handler';
import { SyncMainPopupTranslationsHandler } from '@context/main-popup-context/handlers/jobs/sync-main-popup-translations.handler';
import { SyncShareholdersMeetingTranslationsHandler } from '@context/shareholders-meeting-context/handlers/jobs/sync-shareholders-meeting-translations.handler';
import { Language } from '@domain/common/language/language.entity';
import { LanguageService } from '@domain/common/language/language.service';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';
import { ElectronicDisclosureService } from '@domain/core/electronic-disclosure/electronic-disclosure.service';
import { IRTranslation } from '@domain/core/ir/ir-translation.entity';
import { IRService } from '@domain/core/ir/ir.service';
import { MainPopupTranslation } from '@domain/sub/main-popup/main-popup-translation.entity';
import { MainPopupService } from '@domain/sub/main-popup/main-popup.service';
import { ShareholdersMeetingTranslation } from '@domain/core/shareholders-meeting/shareholders-meeting-translation.entity';
import { ShareholdersMeetingService } from '@domain/core/shareholders-meeting/shareholders-meeting.service';

/**
 * 번역 동기화 트리거 서비스
 *
 * 언어 활성화/추가 시 모든 콘텐츠의 번역 동기화를 트리거합니다.
 */
@Injectable()
export class TranslationSyncTriggerService {
  private readonly logger = new Logger(TranslationSyncTriggerService.name);

  constructor(
    private readonly syncBrochureHandler: SyncBrochureTranslationsHandler,
    private readonly syncElectronicDisclosureHandler: SyncElectronicDisclosureTranslationsHandler,
    private readonly syncIRHandler: SyncIRTranslationsHandler,
    private readonly syncMainPopupHandler: SyncMainPopupTranslationsHandler,
    private readonly syncShareholdersMeetingHandler: SyncShareholdersMeetingTranslationsHandler,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    private readonly languageService: LanguageService,
    private readonly brochureService: BrochureService,
    @InjectRepository(BrochureTranslation)
    private readonly brochureTranslationRepository: Repository<BrochureTranslation>,
    private readonly electronicDisclosureService: ElectronicDisclosureService,
    @InjectRepository(ElectronicDisclosureTranslation)
    private readonly electronicDisclosureTranslationRepository: Repository<ElectronicDisclosureTranslation>,
    private readonly irService: IRService,
    @InjectRepository(IRTranslation)
    private readonly irTranslationRepository: Repository<IRTranslation>,
    private readonly mainPopupService: MainPopupService,
    @InjectRepository(MainPopupTranslation)
    private readonly mainPopupTranslationRepository: Repository<MainPopupTranslation>,
    private readonly shareholdersMeetingService: ShareholdersMeetingService,
    @InjectRepository(ShareholdersMeetingTranslation)
    private readonly shareholdersMeetingTranslationRepository: Repository<ShareholdersMeetingTranslation>,
  ) {}

  /**
   * 언어 활성화 시 모든 번역 동기화를 트리거한다
   *
   * @param languageCode 활성화된 언어 코드
   */
  async 언어_활성화_시_번역_동기화(languageCode: string): Promise<void> {
    this.logger.log(
      `언어 활성화로 인한 번역 생성 및 동기화 시작 - 언어 코드: ${languageCode}`,
    );

    try {
      // 추가된 언어 조회
      const newLanguage = await this.languageRepository.findOne({
        where: { code: languageCode },
      });

      if (!newLanguage) {
        this.logger.warn(`언어를 찾을 수 없습니다 - 코드: ${languageCode}`);
        return;
      }

      // 기본 언어 조회
      const baseLanguage = await this.languageService.기본_언어를_조회한다();
      if (!baseLanguage) {
        this.logger.warn('기본 언어를 찾을 수 없습니다. 동기화를 건너뜁니다.');
        return;
      }

      const syncResults = {
        brochure: { created: 0, synced: 0, failed: false },
        electronicDisclosure: { created: 0, synced: 0, failed: false },
        ir: { created: 0, synced: 0, failed: false },
        mainPopup: { created: 0, synced: 0, failed: false },
        shareholdersMeeting: { created: 0, synced: 0, failed: false },
      };

      // 1. 브로슈어 번역 생성 및 동기화
      try {
        this.logger.debug('브로슈어 번역 생성 및 동기화 시작');
        const brochures = await this.brochureService.모든_브로슈어를_조회한다();

        for (const brochure of brochures) {
          // 이미 해당 언어 번역이 있는지 확인
          const existingTranslation =
            await this.brochureTranslationRepository.findOne({
              where: {
                brochureId: brochure.id,
                languageId: newLanguage.id,
              },
            });

          if (!existingTranslation) {
            // 기본 언어 번역 찾기
            const baseTranslation =
              await this.brochureTranslationRepository.findOne({
                where: {
                  brochureId: brochure.id,
                  languageId: baseLanguage.id,
                },
              });

            if (baseTranslation) {
              // 새 언어로 번역 생성 (기본 언어 내용 복사)
              const newTranslation = this.brochureTranslationRepository.create({
                brochureId: brochure.id,
                languageId: newLanguage.id,
                title: baseTranslation.title,
                description: baseTranslation.description,
                isSynced: true,
                createdBy: 'system',
                updatedBy: 'system',
              });
              await this.brochureTranslationRepository.save(newTranslation);
              syncResults.brochure.created++;
            }
          }
        }

        // 기존 번역 동기화 실행
        await this.syncBrochureHandler.execute();
        this.logger.debug(
          `브로슈어 번역 생성 및 동기화 완료 - 생성: ${syncResults.brochure.created}개`,
        );
      } catch (error) {
        syncResults.brochure.failed = true;
        this.logger.error(
          '브로슈어 번역 생성 및 동기화 실패',
          error.stack || error.message,
        );
      }

      // 2. 전자공시 번역 생성 및 동기화
      try {
        this.logger.debug('전자공시 번역 생성 및 동기화 시작');
        const disclosures =
          await this.electronicDisclosureService.모든_전자공시를_조회한다();

        for (const disclosure of disclosures) {
          const existingTranslation =
            await this.electronicDisclosureTranslationRepository.findOne({
              where: {
                electronicDisclosureId: disclosure.id,
                languageId: newLanguage.id,
              },
            });

          if (!existingTranslation) {
            const baseTranslation =
              await this.electronicDisclosureTranslationRepository.findOne({
                where: {
                  electronicDisclosureId: disclosure.id,
                  languageId: baseLanguage.id,
                },
              });

            if (baseTranslation) {
              const newTranslation =
                this.electronicDisclosureTranslationRepository.create({
                  electronicDisclosureId: disclosure.id,
                  languageId: newLanguage.id,
                  title: baseTranslation.title,
                  description: baseTranslation.description,
                  isSynced: true,
                  createdBy: 'system',
                  updatedBy: 'system',
                });
              await this.electronicDisclosureTranslationRepository.save(
                newTranslation,
              );
              syncResults.electronicDisclosure.created++;
            }
          }
        }

        await this.syncElectronicDisclosureHandler.execute();
        this.logger.debug(
          `전자공시 번역 생성 및 동기화 완료 - 생성: ${syncResults.electronicDisclosure.created}개`,
        );
      } catch (error) {
        syncResults.electronicDisclosure.failed = true;
        this.logger.error(
          '전자공시 번역 생성 및 동기화 실패',
          error.stack || error.message,
        );
      }

      // 3. IR 번역 생성 및 동기화
      try {
        this.logger.debug('IR 번역 생성 및 동기화 시작');
        const irs = await this.irService.모든_IR을_조회한다();

        for (const ir of irs) {
          const existingTranslation = await this.irTranslationRepository.findOne(
            {
              where: {
                irId: ir.id,
                languageId: newLanguage.id,
              },
            },
          );

          if (!existingTranslation) {
            const baseTranslation = await this.irTranslationRepository.findOne({
              where: {
                irId: ir.id,
                languageId: baseLanguage.id,
              },
            });

            if (baseTranslation) {
              const newTranslation = this.irTranslationRepository.create({
                irId: ir.id,
                languageId: newLanguage.id,
                title: baseTranslation.title,
                isSynced: true,
                createdBy: 'system',
                updatedBy: 'system',
              });
              await this.irTranslationRepository.save(newTranslation);
              syncResults.ir.created++;
            }
          }
        }

        await this.syncIRHandler.execute();
        this.logger.debug(
          `IR 번역 생성 및 동기화 완료 - 생성: ${syncResults.ir.created}개`,
        );
      } catch (error) {
        syncResults.ir.failed = true;
        this.logger.error(
          'IR 번역 생성 및 동기화 실패',
          error.stack || error.message,
        );
      }

      // 4. 메인 팝업 번역 생성 및 동기화
      try {
        this.logger.debug('메인 팝업 번역 생성 및 동기화 시작');
        const popups = await this.mainPopupService.모든_메인_팝업을_조회한다();

        for (const popup of popups) {
          const existingTranslation =
            await this.mainPopupTranslationRepository.findOne({
              where: {
                mainPopupId: popup.id,
                languageId: newLanguage.id,
              },
            });

          if (!existingTranslation) {
            const baseTranslation =
              await this.mainPopupTranslationRepository.findOne({
                where: {
                  mainPopupId: popup.id,
                  languageId: baseLanguage.id,
                },
              });

            if (baseTranslation) {
              const newTranslation = this.mainPopupTranslationRepository.create({
                mainPopupId: popup.id,
                languageId: newLanguage.id,
                title: baseTranslation.title,
                description: baseTranslation.description,
                isSynced: true,
                createdBy: 'system',
                updatedBy: 'system',
              });
              await this.mainPopupTranslationRepository.save(newTranslation);
              syncResults.mainPopup.created++;
            }
          }
        }

        await this.syncMainPopupHandler.execute();
        this.logger.debug(
          `메인 팝업 번역 생성 및 동기화 완료 - 생성: ${syncResults.mainPopup.created}개`,
        );
      } catch (error) {
        syncResults.mainPopup.failed = true;
        this.logger.error(
          '메인 팝업 번역 생성 및 동기화 실패',
          error.stack || error.message,
        );
      }

      // 5. 주주총회 번역 생성 및 동기화
      try {
        this.logger.debug('주주총회 번역 생성 및 동기화 시작');
        const meetings =
          await this.shareholdersMeetingService.모든_주주총회를_조회한다();

        for (const meeting of meetings) {
          const existingTranslation =
            await this.shareholdersMeetingTranslationRepository.findOne({
              where: {
                shareholdersMeetingId: meeting.id,
                languageId: newLanguage.id,
              },
            });

          if (!existingTranslation) {
            const baseTranslation =
              await this.shareholdersMeetingTranslationRepository.findOne({
                where: {
                  shareholdersMeetingId: meeting.id,
                  languageId: baseLanguage.id,
                },
              });

            if (baseTranslation) {
              const newTranslation =
                this.shareholdersMeetingTranslationRepository.create({
                  shareholdersMeetingId: meeting.id,
                  languageId: newLanguage.id,
                  title: baseTranslation.title,
                  isSynced: true,
                  createdBy: 'system',
                  updatedBy: 'system',
                });
              await this.shareholdersMeetingTranslationRepository.save(
                newTranslation,
              );
              syncResults.shareholdersMeeting.created++;
            }
          }
        }

        await this.syncShareholdersMeetingHandler.execute();
        this.logger.debug(
          `주주총회 번역 생성 및 동기화 완료 - 생성: ${syncResults.shareholdersMeeting.created}개`,
        );
      } catch (error) {
        syncResults.shareholdersMeeting.failed = true;
        this.logger.error(
          '주주총회 번역 생성 및 동기화 실패',
          error.stack || error.message,
        );
      }

      // 결과 로깅
      const totalCreated =
        syncResults.brochure.created +
        syncResults.electronicDisclosure.created +
        syncResults.ir.created +
        syncResults.mainPopup.created +
        syncResults.shareholdersMeeting.created;

      const totalModules = 5;
      const failedCount = Object.values(syncResults).filter((r) => r.failed)
        .length;
      const successCount = totalModules - failedCount;

      this.logger.log(
        `언어 활성화로 인한 번역 생성 및 동기화 완료 - ` +
          `총 ${totalCreated}개 번역 생성, ` +
          `성공: ${successCount}/${totalModules} 모듈, ` +
          `실패: ${failedCount}/${totalModules} 모듈 ` +
          `(언어: ${languageCode})`,
      );

      if (failedCount > 0) {
        this.logger.warn(
          `일부 모듈 번역 동기화 실패 - 실패한 모듈: ${failedCount}개`,
          syncResults,
        );
      }
    } catch (error) {
      this.logger.error(
        `번역 동기화 프로세스 실패 - 언어: ${languageCode}`,
        error.stack || error.message,
      );
    }
  }
}
