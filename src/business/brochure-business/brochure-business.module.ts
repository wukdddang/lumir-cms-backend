import { Module } from '@nestjs/common';
import { BrochureContextModule } from '@context/brochure-context/brochure-context.module';
import { BrochureBusinessService } from './brochure-business.service';

/**
 * 브로슈어 비즈니스 모듈
 * 
 * Business → Context → Domain 아키텍처를 따름
 * Domain 레이어에 직접 의존하지 않음
 */
@Module({
  imports: [BrochureContextModule],
  providers: [BrochureBusinessService],
  exports: [BrochureBusinessService],
})
export class BrochureBusinessModule {}
