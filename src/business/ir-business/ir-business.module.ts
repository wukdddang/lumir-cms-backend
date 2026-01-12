import { Module } from '@nestjs/common';
import { IRBusinessService } from './ir-business.service';
import { IRContextModule } from '@context/ir-context/ir-context.module';
import { CategoryModule } from '@domain/common/category/category.module';
import { StorageModule } from '@libs/storage/storage.module';

@Module({
  imports: [IRContextModule, CategoryModule, StorageModule],
  providers: [IRBusinessService],
  exports: [IRBusinessService],
})
export class IRBusinessModule {}
