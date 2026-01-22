import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareholdersMeetingTranslationUpdatedEvent } from '../../events/shareholders-meeting-translation-updated.event';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { ShareholdersMeetingTranslation } from '@domain/core/shareholders-meeting/shareholders-meeting-translation.entity';
import { LanguageService } from '@domain/common/language/language.service';

/**
 * 주주총회 번역 업데이트 이벤트 핸들러
 *
 * 기본 언어 번역이 업데이트되면 isSynced가 true인 다른 언어들을 자동으로 동기화합니다.
 * 비동기로 실행되어 원본 요청을 블로킹하지 않습니다.
 */
@Injectable()
@EventsHandler(ShareholdersMeetingTranslationUpdatedEvent)
export class ShareholdersMeetingTranslationUpdatedHandler
  implements IEventHandler<ShareholdersMeetingTranslationUpdatedEvent>
{
  private readonly logger = new Logger(
    ShareholdersMeetingTranslationUpdatedHandler.name,
  );

  constructor(
    @InjectRepository(ShareholdersMeeting)
    private readonly shareholdersMeetingRepository: Repository<ShareholdersMeeting>,
    @InjectRepository(ShareholdersMeetingTranslation)
    private readonly translationRepository: Repository<ShareholdersMeetingTranslation>,
    private readonly languageService: LanguageService,
  ) {}

  /**
   * 이벤트 처리: isSynced가 true인 번역들을 기본 언어와 동기화
   */
  async handle(
    event: ShareholdersMeetingTranslationUpdatedEvent,
  ): Promise<void> {
    this.logger.log(
      `주주총회 번역 동기화 이벤트 수신 - 주주총회 ID: ${event.shareholdersMeetingId}`,
    );

    try {
      // 주주총회 존재 여부 확인
      const shareholdersMeeting = await this.shareholdersMeetingRepository.findOne({
        where: { id: event.shareholdersMeetingId },
      });

      if (!shareholdersMeeting) {
        this.logger.debug(
          `주주총회가 존재하지 않아 동기화를 건너뜁니다 - 주주총회 ID: ${event.shareholdersMeetingId}`,
        );
        return;
      }

      // 기본 언어 확인
      let baseLanguage;
      try {
        baseLanguage = await this.languageService.기본_언어를_조회한다();
      } catch (error) {
        this.logger.debug(
          '기본 언어를 찾을 수 없어 동기화를 건너뜁니다.',
          error instanceof Error ? error.message : error,
        );
        return;
      }

      if (!baseLanguage || event.languageId !== baseLanguage.id) {
        this.logger.debug(
          '기본 언어 번역이 아니므로 동기화를 건너뜁니다.',
        );
        return;
      }

      // isSynced가 true인 다른 언어 번역들 조회
      const syncedTranslations = await this.translationRepository.find({
        where: {
          shareholdersMeetingId: event.shareholdersMeetingId,
          isSynced: true,
        },
      });

      // 기본 언어를 제외한 동기화 대상 번역들
      const translationsToSync = syncedTranslations.filter(
        (t) => t.languageId !== baseLanguage.id,
      );

      if (translationsToSync.length === 0) {
        this.logger.debug('동기화할 번역이 없습니다.');
        return;
      }

      // 기본 언어 원본과 동기화
      let syncedCount = 0;
      for (const translation of translationsToSync) {
        try {
          // 주주총회가 여전히 존재하는지 다시 확인
          const exists = await this.shareholdersMeetingRepository.exist({
            where: { id: event.shareholdersMeetingId },
          });

          if (!exists) {
            this.logger.debug(
              `주주총회가 삭제되어 동기화를 중단합니다 - 주주총회 ID: ${event.shareholdersMeetingId}`,
            );
            break;
          }

          translation.title = event.title;
          translation.description = event.description ?? null;
          translation.updatedBy = event.updatedBy || translation.updatedBy;
          await this.translationRepository.save(translation);
          syncedCount++;
        } catch (error) {
          // 외래 키 제약 조건 위반 등의 에러는 무시
          this.logger.debug(
            `번역 동기화 실패 (무시됨) - 번역 ID: ${translation.id}`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      this.logger.log(
        `주주총회 번역 동기화 완료 - 주주총회 ID: ${event.shareholdersMeetingId}, 동기화된 번역 수: ${syncedCount}`,
      );
    } catch (error) {
      this.logger.error(
        `주주총회 번역 동기화 실패 - 주주총회 ID: ${event.shareholdersMeetingId}`,
        error,
      );
      // 에러를 다시 던지지 않아 원본 요청에 영향을 주지 않음
    }
  }
}
