import { Module } from '@nestjs/common';
import { ElectronicDisclosureContextService } from './electronic-disclosure-context.service';
import { ElectronicDisclosureModule } from '@domain/core/electronic-disclosure/electronic-disclosure.module';

/**
 * 전자공시 컨텍스트 모듈
 */
@Module({
  imports: [ElectronicDisclosureModule],
  providers: [ElectronicDisclosureContextService],
  exports: [ElectronicDisclosureContextService],
})
export class ElectronicDisclosureContextModule {}
