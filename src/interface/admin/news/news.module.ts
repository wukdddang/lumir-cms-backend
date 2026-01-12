import { Module } from '@nestjs/common';
import { NewsBusinessModule } from '@business/news-business/news-business.module';
import { NewsController } from './news.controller';

/**
 * 뉴스 관리자 인터페이스 모듈
 * 뉴스 관리 엔드포인트를 제공합니다.
 */
@Module({
  imports: [NewsBusinessModule],
  controllers: [NewsController],
})
export class AdminNewsModule {}
