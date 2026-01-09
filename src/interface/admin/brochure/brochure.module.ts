import { Module } from '@nestjs/common';
import { BrochureBusinessModule } from '@business/brochure-business/brochure-business.module';
import { BrochureController } from './brochure.controller';

/**
 * 브로슈어 인터페이스 모듈
 */
@Module({
  imports: [BrochureBusinessModule],
  controllers: [BrochureController],
})
export class BrochureInterfaceModule {}
