import { Module } from '@nestjs/common';
import { IRController } from './ir.controller';
import { IRBusinessModule } from '@business/ir-business/ir-business.module';

/**
 * IR 인터페이스 모듈
 */
@Module({
  imports: [IRBusinessModule],
  controllers: [IRController],
})
export class IRInterfaceModule {}
