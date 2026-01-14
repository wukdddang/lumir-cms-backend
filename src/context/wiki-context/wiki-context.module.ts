import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WikiFileSystemModule } from '@domain/sub/wiki-file-system/wiki-file-system.module';
import { WikiContextService } from './wiki-context.service';
import { WikiHandlers } from './handlers';

@Module({
  imports: [CqrsModule, WikiFileSystemModule],
  providers: [WikiContextService, ...WikiHandlers],
  exports: [WikiContextService],
})
export class WikiContextModule {}
