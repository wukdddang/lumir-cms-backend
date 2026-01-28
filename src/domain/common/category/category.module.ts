import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CategoryContextService } from './category-context.service';

/**
 * 카테고리 모듈
 * 통합 카테고리 관리 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategoryService, CategoryContextService],
  exports: [CategoryService, CategoryContextService],
})
export class CategoryModule {}
