import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IRContextService } from './ir-context.service';
import { IRModule } from '@domain/core/ir/ir.module';
import { LanguageModule } from '@domain/common/language/language.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { IR } from '@domain/core/ir/ir.entity';
import { IRTranslation } from '@domain/core/ir/ir-translation.entity';
import {
  SyncIRTranslationsHandler,
  IRTranslationUpdatedHandler,
} from './handlers';
import { IRSyncScheduler } from './ir-sync.scheduler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([IR, IRTranslation]),
    IRModule,
    LanguageModule,
    CategoryModule,
  ],
  providers: [
    IRContextService,
    SyncIRTranslationsHandler,
    IRTranslationUpdatedHandler,
    IRSyncScheduler,
  ],
  exports: [IRContextService],
})
export class IRContextModule {}
