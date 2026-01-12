import { Module } from '@nestjs/common';
import { MainPopupContextService } from './main-popup-context.service';
import { MainPopupModule } from '@domain/sub/main-popup/main-popup.module';
import { LanguageModule } from '@domain/common/language/language.module';

@Module({
  imports: [MainPopupModule, LanguageModule],
  providers: [MainPopupContextService],
  exports: [MainPopupContextService],
})
export class MainPopupContextModule {}
