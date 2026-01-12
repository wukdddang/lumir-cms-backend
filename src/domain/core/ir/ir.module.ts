import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IR } from './ir.entity';
import { IRTranslation } from './ir-translation.entity';
import { IRService } from './ir.service';

/**
 * IR 모듈
 * IR 자료 관리 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([IR, IRTranslation])],
  providers: [IRService],
  exports: [IRService],
})
export class IRModule {}
