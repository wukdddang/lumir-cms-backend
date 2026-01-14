import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WikiFileSystem } from './wiki-file-system.entity';
import { WikiFileSystemClosure } from './wiki-file-system-closure.entity';
import { WikiPermissionLog } from './wiki-permission-log.entity';
import { WikiFileSystemService } from './wiki-file-system.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WikiFileSystem,
      WikiFileSystemClosure,
      WikiPermissionLog,
    ]),
  ],
  providers: [WikiFileSystemService],
  exports: [WikiFileSystemService],
})
export class WikiFileSystemModule {}
