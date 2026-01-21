import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncBrochureTranslationsHandler } from './handlers/jobs/sync-brochure-translations.handler';

/**
 * 브로슈어 동기화 스케줄러
 *
 * 1시간마다 브로슈어 번역 동기화 작업을 실행합니다. (백업용)
 * 실시간 동기화는 이벤트 핸들러에서 처리합니다.
 */
@Injectable()
export class BrochureSyncScheduler {
  private readonly logger = new Logger(BrochureSyncScheduler.name);

  constructor(
    private readonly syncHandler: SyncBrochureTranslationsHandler,
  ) {}

  /**
   * 1시간마다 브로슈어 번역 동기화 실행 (백업용)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleBrochureTranslationSync() {
    try {
      this.logger.debug('브로슈어 번역 동기화 스케줄러 실행 (백업)');
      await this.syncHandler.execute();
    } catch (error) {
      // 테스트 환경에서 언어 데이터가 없을 수 있으므로 에러를 로그만 남기고 계속 진행
      this.logger.error('브로슈어 번역 동기화 작업 실패 (스케줄러에서 처리됨)', error.message);
    }
  }
}
