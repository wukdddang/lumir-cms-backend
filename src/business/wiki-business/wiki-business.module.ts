import { Module } from '@nestjs/common';
import { WikiContextModule } from '@context/wiki-context';
import { StorageModule } from '@libs/storage/storage.module';
import { WikiBusinessService } from './wiki-business.service';

@Module({
  imports: [WikiContextModule, StorageModule],
  providers: [WikiBusinessService],
  exports: [WikiBusinessService],
})
export class WikiBusinessModule {}
