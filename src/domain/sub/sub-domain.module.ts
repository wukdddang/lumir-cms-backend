import { Module } from '@nestjs/common';
import { WikiFileSystemModule } from './wiki-file-system/wiki-file-system.module';
import { PageViewModule } from './analytics/page-view.module';

/**
 * Sub Domain 통합 모듈
 * 부가 기능 도메인의 모든 모듈을 통합합니다.
 */
@Module({
  imports: [
    WikiFileSystemModule,
    PageViewModule,
  ],
  exports: [
    WikiFileSystemModule,
    PageViewModule,
  ],
})
export class SubDomainModule {}
