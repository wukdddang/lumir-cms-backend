import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AnnouncementBusinessService } from './announcement-business.service';
import { AnnouncementContextModule } from '@context/announcement-context/announcement-context.module';
import { SurveyContextModule } from '@context/survey-context/survey-context.module';
import { CompanyContextModule } from '@context/company-context/company-context.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { SsoModule } from '@domain/common/sso/sso.module';
import { AnnouncementRead } from '@domain/core/announcement/announcement-read.entity';
import { Survey } from '@domain/sub/survey/survey.entity';
import { SurveyQuestion } from '@domain/sub/survey/survey-question.entity';
import { SurveyCompletion } from '@domain/sub/survey/survey-completion.entity';

/**
 * 공지사항 비즈니스 모듈
 *
 * 공지사항 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnnouncementRead,
      Survey,
      SurveyQuestion,
      SurveyCompletion,
    ]),
    ConfigModule,
    AnnouncementContextModule,
    SurveyContextModule,
    CompanyContextModule,
    CategoryModule,
    SsoModule,
  ],
  providers: [AnnouncementBusinessService],
  exports: [AnnouncementBusinessService],
})
export class AnnouncementBusinessModule {}
