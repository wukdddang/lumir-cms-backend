import { Module } from '@nestjs/common';
import { IRContextService } from './ir-context.service';
import { IRModule } from '@domain/core/ir/ir.module';
import { LanguageModule } from '@domain/common/language/language.module';

@Module({
  imports: [IRModule, LanguageModule],
  providers: [IRContextService],
  exports: [IRContextService],
})
export class IRContextModule {}
