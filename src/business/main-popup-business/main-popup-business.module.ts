import { Module } from '@nestjs/common';
import { MainPopupBusinessService } from './main-popup-business.service';
import { MainPopupContextModule } from '@context/main-popup-context/main-popup-context.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { StorageModule } from '@libs/storage/storage.module';

@Module({
  imports: [MainPopupContextModule, CategoryModule, StorageModule],
  providers: [MainPopupBusinessService],
  exports: [MainPopupBusinessService],
})
export class MainPopupBusinessModule {}
