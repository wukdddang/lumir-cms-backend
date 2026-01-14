import { Module } from '@nestjs/common';
import { WikiFileSystemModule } from './wiki-file-system/wiki-file-system.module';
// TODO: 모듈들 추가
// import { MainPopupModule } from './main-popup/main-popup.module';
// import { LumirStoryModule } from './lumir-story/lumir-story.module';
// import { VideoGalleryModule } from './video-gallery/video-gallery.module';
// import { SurveyModule } from './survey/survey.module';
// import { EducationManagementModule } from './education-management/education-management.module';

/**
 * Sub Domain 통합 모듈
 * 부가 기능 도메인의 모든 모듈을 통합합니다.
 */
@Module({
  imports: [
    WikiFileSystemModule,
    // TODO: 모듈들 추가
  ],
  exports: [
    WikiFileSystemModule,
    // TODO: 모듈들 추가
  ],
})
export class SubDomainModule {}
