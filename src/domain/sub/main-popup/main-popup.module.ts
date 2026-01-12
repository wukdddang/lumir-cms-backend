import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainPopup } from './main-popup.entity';
import { MainPopupTranslation } from './main-popup-translation.entity';
import { MainPopupService } from './main-popup.service';

@Module({
  imports: [TypeOrmModule.forFeature([MainPopup, MainPopupTranslation])],
  providers: [MainPopupService],
  exports: [MainPopupService],
})
export class MainPopupModule {}
