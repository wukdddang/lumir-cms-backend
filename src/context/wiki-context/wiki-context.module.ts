import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WikiFileSystemModule } from '@domain/sub/wiki-file-system/wiki-file-system.module';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { WikiPermissionLog } from '@domain/sub/wiki-file-system/wiki-permission-log.entity';
import { WikiContextService } from './wiki-context.service';
import { WikiPermissionScheduler } from './wiki-permission.scheduler';
import { WikiHandlers } from './handlers';
import { SsoModule } from '@domain/common/sso/sso.module';

@Module({
  imports: [
    CqrsModule,
    WikiFileSystemModule,
    TypeOrmModule.forFeature([WikiFileSystem, WikiPermissionLog]),
    SsoModule,
  ],
  providers: [WikiContextService, WikiPermissionScheduler, ...WikiHandlers],
  exports: [WikiContextService, WikiPermissionScheduler],
})
export class WikiContextModule {}
