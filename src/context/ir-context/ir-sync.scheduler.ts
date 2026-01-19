import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncIRTranslationsHandler } from './handlers/jobs/sync-ir-translations.handler';

/**
 * IR 동기화 스케줄러
 *
 * 1분마다 IR 번역 동기화 작업을 실행합니다.
 */
@Injectable()
export class IRSyncScheduler {
  private readonly logger = new Logger(IRSyncScheduler.name);

  constructor(private readonly syncHandler: SyncIRTranslationsHandler) {}

  /**
   * 1분마다 IR 번역 동기화 실행
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleIRTranslationSync() {
    try {
      this.logger.debug('IR 번역 동기화 스케줄러 실행');
      await this.syncHandler.execute();
    } catch (error) {
      // 테스트 환경에서 언어 데이터가 없을 수 있으므로 에러를 로그만 남기고 계속 진행
      this.logger.error(
        'IR 번역 동기화 작업 실패 (스케줄러에서 처리됨)',
        error.message,
      );
    }
  }
}
