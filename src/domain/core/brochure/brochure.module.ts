import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brochure } from './brochure.entity';
import { BrochureTranslation } from './brochure-translation.entity';
import { BrochureService } from './brochure.service';

/**
 * 브로슈어 모듈
 * 브로슈어 관리 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Brochure, BrochureTranslation])],
  providers: [BrochureService],
  exports: [BrochureService],
})
export class BrochureModule {}
