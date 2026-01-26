import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageView } from './page-view.entity';
import { PageViewService } from './page-view.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageView])],
  providers: [PageViewService],
  exports: [PageViewService],
})
export class PageViewModule {}
