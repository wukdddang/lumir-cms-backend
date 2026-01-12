import { Module } from '@nestjs/common';
import { ElectronicDisclosureController } from './electronic-disclosure.controller';
import { ElectronicDisclosureBusinessModule } from '@business/electronic-disclosure-business/electronic-disclosure-business.module';

/**
 * 전자공시 인터페이스 모듈
 */
@Module({
  imports: [ElectronicDisclosureBusinessModule],
  controllers: [ElectronicDisclosureController],
})
export class ElectronicDisclosureInterfaceModule {}
