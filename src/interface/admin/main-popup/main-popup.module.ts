import { Module } from '@nestjs/common';
import { MainPopupController } from './main-popup.controller';
import { MainPopupBusinessModule } from '@business/main-popup-business/main-popup-business.module';

/**
 * 메인 팝업 인터페이스 모듈
 */
@Module({
  imports: [MainPopupBusinessModule],
  controllers: [MainPopupController],
})
export class MainPopupInterfaceModule {}
