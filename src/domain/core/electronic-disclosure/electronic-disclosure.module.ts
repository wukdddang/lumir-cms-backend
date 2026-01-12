import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectronicDisclosure } from './electronic-disclosure.entity';
import { ElectronicDisclosureTranslation } from './electronic-disclosure-translation.entity';
import { ElectronicDisclosureService } from './electronic-disclosure.service';

/**
 * 전자공시 모듈
 * 전자공시 관리 기능을 제공합니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ElectronicDisclosure,
      ElectronicDisclosureTranslation,
    ]),
  ],
  providers: [ElectronicDisclosureService],
  exports: [ElectronicDisclosureService],
})
export class ElectronicDisclosureModule {}
