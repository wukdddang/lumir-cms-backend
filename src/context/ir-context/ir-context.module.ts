import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IRContextService } from './ir-context.service';
import { IRModule } from '@domain/core/ir/ir.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { IRTranslation } from '@domain/core/ir/ir-translation.entity';
import { SyncIRTranslationsHandler } from './handlers';
import { IRSyncScheduler } from './ir-sync.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([IRTranslation]),
    IRModule,
    LanguageModule,
  ],
  providers: [IRContextService, SyncIRTranslationsHandler, IRSyncScheduler],
  exports: [IRContextService],
})
export class IRContextModule {}
