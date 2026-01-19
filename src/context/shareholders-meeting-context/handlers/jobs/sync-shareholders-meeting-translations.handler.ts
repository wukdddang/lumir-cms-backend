import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareholdersMeetingService } from '@domain/core/shareholders-meeting/shareholders-meeting.service';
import { LanguageService } from '@domain/common/language/language.service';
import { ShareholdersMeetingTranslation } from '@domain/core/shareholders-meeting/shareholders-meeting-translation.entity';
import { VoteResultTranslation } from '@domain/core/shareholders-meeting/vote-result-translation.entity';

/**
 * 주주총회 번역 동기화 핸들러
 *
 * isSynced가 true인 번역들을 한국어 원본과 동기화합니다.
 * 1분마다 실행됩니다.
 */
@Injectable()
export class SyncShareholdersMeetingTranslationsHandler {
  private readonly logger = new Logger(
    SyncShareholdersMeetingTranslationsHandler.name,
  );

  constructor(
    private readonly shareholdersMeetingService: ShareholdersMeetingService,
    private readonly languageService: LanguageService,
    @InjectRepository(ShareholdersMeetingTranslation)
    private readonly meetingTranslationRepository: Repository<ShareholdersMeetingTranslation>,
    @InjectRepository(VoteResultTranslation)
    private readonly voteResultTranslationRepository: Repository<VoteResultTranslation>,
  ) {}

  /**
   * 주주총회 번역 동기화 작업 실행
   */
  async execute(): Promise<void> {
    this.logger.log('주주총회 번역 동기화 작업 시작');

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

      // 모든 주주총회 조회
      const meetings =
        await this.shareholdersMeetingService.모든_주주총회를_조회한다();

      let totalSyncedCount = 0;

      for (const meeting of meetings) {
        // 주주총회 번역 동기화
        const koreanMeetingTranslation =
          await this.meetingTranslationRepository.findOne({
            where: {
              shareholdersMeetingId: meeting.id,
              languageId: koreanLanguage.id,
            },
          });

        if (!koreanMeetingTranslation) {
          this.logger.warn(
            `한국어 번역을 찾을 수 없습니다 - 주주총회 ID: ${meeting.id}`,
          );
          continue;
        }

        // isSynced가 true인 다른 언어 번역들 조회
        const syncedMeetingTranslations =
          await this.meetingTranslationRepository.find({
            where: {
              shareholdersMeetingId: meeting.id,
              isSynced: true,
            },
          });

        // 한국어를 제외한 동기화 대상 번역들
        const meetingTranslationsToSync = syncedMeetingTranslations.filter(
          (t) => t.languageId !== koreanLanguage.id,
        );

        // 한국어 원본과 동기화
        for (const translation of meetingTranslationsToSync) {
          translation.title = koreanMeetingTranslation.title;
          translation.description = koreanMeetingTranslation.description;
          translation.content = koreanMeetingTranslation.content;
          translation.resultText = koreanMeetingTranslation.resultText;
          translation.summary = koreanMeetingTranslation.summary;
          await this.meetingTranslationRepository.save(translation);
          totalSyncedCount++;
        }

        this.logger.debug(
          `주주총회 동기화 완료 - ID: ${meeting.id}, 동기화된 번역 수: ${meetingTranslationsToSync.length}`,
        );

        // 의결 결과 번역 동기화
        const voteResults =
          await this.shareholdersMeetingService.의결_결과를_조회한다(
            meeting.id,
          );

        for (const voteResult of voteResults) {
          const koreanVoteResultTranslation =
            await this.voteResultTranslationRepository.findOne({
              where: {
                voteResultId: voteResult.id,
                languageId: koreanLanguage.id,
              },
            });

          if (!koreanVoteResultTranslation) {
            this.logger.warn(
              `한국어 의결 결과 번역을 찾을 수 없습니다 - 의결 결과 ID: ${voteResult.id}`,
            );
            continue;
          }

          // isSynced가 true인 다른 언어 번역들 조회
          const syncedVoteResultTranslations =
            await this.voteResultTranslationRepository.find({
              where: {
                voteResultId: voteResult.id,
                isSynced: true,
              },
            });

          // 한국어를 제외한 동기화 대상 번역들
          const voteResultTranslationsToSync =
            syncedVoteResultTranslations.filter(
              (t) => t.languageId !== koreanLanguage.id,
            );

          // 한국어 원본과 동기화
          for (const translation of voteResultTranslationsToSync) {
            translation.title = koreanVoteResultTranslation.title;
            await this.voteResultTranslationRepository.save(translation);
            totalSyncedCount++;
          }
        }
      }

      this.logger.log(
        `주주총회 번역 동기화 작업 완료 - 총 동기화된 번역 수: ${totalSyncedCount}`,
      );
    } catch (error) {
      this.logger.error('주주총회 번역 동기화 작업 실패', error);
    }
  }
}
