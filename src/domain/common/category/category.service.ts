import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CategoryEntityType } from './category-entity-type.types';

/**
 * 카테고리 서비스
 * 통합 카테고리 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * 카테고리를 생성한다
   */
  async 카테고리를_생성한다(data: {
    entityType: CategoryEntityType;
    name: string;
    description?: string;
    isActive: boolean;
    order: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(
      `카테고리 생성 시작 - 타입: ${data.entityType}, 이름: ${data.name}`,
    );

    const category = this.categoryRepository.create(data);
    const saved = await this.categoryRepository.save(category);

    this.logger.log(`카테고리 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 엔티티 타입별 카테고리를 조회한다
   */
  async 엔티티_타입별_카테고리를_조회한다(
    entityType: CategoryEntityType,
    includeInactive = false,
  ): Promise<Category[]> {
    this.logger.debug(
      `엔티티 타입별 카테고리 조회 - 타입: ${entityType}, 비활성 포함: ${includeInactive}`,
    );

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.entityType = :entityType', { entityType });

    if (!includeInactive) {
      queryBuilder.andWhere('category.isActive = :isActive', {
        isActive: true,
      });
    }

    return await queryBuilder.orderBy('category.order', 'ASC').getMany();
  }

  /**
   * ID로 카테고리를 조회한다
   */
  async ID로_카테고리를_조회한다(id: string): Promise<Category> {
    this.logger.debug(`카테고리 조회 - ID: ${id}`);

    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`카테고리를 찾을 수 없습니다. ID: ${id}`);
    }

    return category;
  }

  /**
   * 카테고리를 업데이트한다
   */
  async 카테고리를_업데이트한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`카테고리 업데이트 시작 - ID: ${id}`);

    const category = await this.ID로_카테고리를_조회한다(id);

    // undefined 값을 제외하고 업데이트
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        category[key] = data[key];
      }
    });

    const updated = await this.categoryRepository.save(category);

    this.logger.log(`카테고리 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 카테고리를 삭제한다 (Soft Delete)
   */
  async 카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`카테고리 삭제 시작 - ID: ${id}`);

    const category = await this.ID로_카테고리를_조회한다(id);

    await this.categoryRepository.softRemove(category);

    this.logger.log(`카테고리 삭제 완료 - ID: ${id}`);
    return true;
  }
}
