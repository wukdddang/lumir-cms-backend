import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareholdersMeetingModule } from '@domain/core/shareholders-meeting/shareholders-meeting.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { ShareholdersMeetingContextService } from './shareholders-meeting-context.service';
import { ShareholdersMeetingTranslation } from '@domain/core/shareholders-meeting/shareholders-meeting-translation.entity';
import { VoteResultTranslation } from '@domain/core/shareholders-meeting/vote-result-translation.entity';
import { SyncShareholdersMeetingTranslationsHandler } from './handlers';
import { ShareholdersMeetingSyncScheduler } from './shareholders-meeting-sync.scheduler';

/**
 * 주주총회 컨텍스트 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShareholdersMeetingTranslation,
      VoteResultTranslation,
    ]),
    ShareholdersMeetingModule,
    LanguageModule,
  ],
  providers: [
    ShareholdersMeetingContextService,
    SyncShareholdersMeetingTranslationsHandler,
    ShareholdersMeetingSyncScheduler,
  ],
  exports: [ShareholdersMeetingContextService],
})
export class ShareholdersMeetingContextModule {}
