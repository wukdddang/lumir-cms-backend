import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareholdersMeeting } from './shareholders-meeting.entity';
import { ShareholdersMeetingTranslation } from './shareholders-meeting-translation.entity';
import { VoteResult } from './vote-result.entity';
import { VoteResultTranslation } from './vote-result-translation.entity';
import { ShareholdersMeetingService } from './shareholders-meeting.service';

/**
 * 주주총회 모듈
 * 주주총회 및 의결 결과 관리 기능을 제공합니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShareholdersMeeting,
      ShareholdersMeetingTranslation,
      VoteResult,
      VoteResultTranslation,
    ]),
  ],
  providers: [ShareholdersMeetingService],
  exports: [ShareholdersMeetingService],
})
export class ShareholdersMeetingModule {}
