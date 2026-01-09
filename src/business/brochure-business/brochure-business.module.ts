import { Module } from '@nestjs/common';
import { BrochureContextModule } from '@context/brochure-context/brochure-context.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { BrochureBusinessService } from './brochure-business.service';

/**
 * 브로슈어 비즈니스 모듈
 *
 * Business → Context → Domain 아키텍처를 따름
 * Domain 레이어에 직접 의존하지 않음
 */
@Module({
  imports: [BrochureContextModule, CategoryModule],
  providers: [BrochureBusinessService],
  exports: [BrochureBusinessService],
})
export class BrochureBusinessModule {}
