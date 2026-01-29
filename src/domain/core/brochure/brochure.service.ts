import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from './brochure.entity';
import { BrochureTranslation } from './brochure-translation.entity';

/**
 * 브로슈어 서비스
 * 브로슈어 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class BrochureService {
  private readonly logger = new Logger(BrochureService.name);

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
    @InjectRepository(BrochureTranslation)
    private readonly translationRepository: Repository<BrochureTranslation>,
  ) {}

  /**
   * 브로슈어를 생성한다
   */
  async 브로슈어를_생성한다(data: Partial<Brochure>): Promise<Brochure> {
    this.logger.log(`브로슈어 생성 시작`);

    const brochure = this.brochureRepository.create(data);
    const saved = await this.brochureRepository.save(brochure);

    this.logger.log(`브로슈어 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 브로슈어를 조회한다
   */
  async 모든_브로슈어를_조회한다(options?: {
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
    categoryId?: string;
  }): Promise<Brochure[]> {
    this.logger.debug(`브로슈어 목록 조회`);

    const queryBuilder = this.brochureRepository.createQueryBuilder('brochure');

    // category 조인
    queryBuilder.leftJoin(
      'categories',
      'category',
      'brochure.categoryId = category.id',
    );
    queryBuilder.addSelect(['category.name']);

    let hasWhere = false;

    if (options?.isPublic !== undefined) {
      queryBuilder.where('brochure.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
      hasWhere = true;
    }

    if (options?.categoryId) {
      if (hasWhere) {
        queryBuilder.andWhere('brochure.categoryId = :categoryId', {
          categoryId: options.categoryId,
        });
      } else {
        queryBuilder.where('brochure.categoryId = :categoryId', {
          categoryId: options.categoryId,
        });
        hasWhere = true;
      }
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('brochure.order', 'ASC');
    } else {
      queryBuilder.orderBy('brochure.createdAt', 'DESC');
    }

    const rawAndEntities = await queryBuilder.getRawAndEntities();
    const items = rawAndEntities.entities;
    const raw = rawAndEntities.raw;

    // raw 데이터에서 category name을 엔티티에 매핑
    // Brochure는 translations가 없지만, 일관성을 위해 id로 매핑
    items.forEach((brochure) => {
      const matchingRaw = raw.find((r) => r.brochure_id === brochure.id);
      if (matchingRaw && matchingRaw.category_name) {
        brochure.category = {
          name: matchingRaw.category_name,
        };
      }
    });

    return items;
  }

  /**
   * ID로 브로슈어를 조회한다
   */
  async ID로_브로슈어를_조회한다(id: string): Promise<Brochure> {
    this.logger.debug(`브로슈어 조회 - ID: ${id}`);

    const queryBuilder = this.brochureRepository
      .createQueryBuilder('brochure')
      .leftJoinAndSelect('brochure.translations', 'translations')
      .leftJoinAndSelect('translations.language', 'language')
      .leftJoin('categories', 'category', 'brochure.categoryId = category.id')
      .addSelect(['category.name'])
      .where('brochure.id = :id', { id });

    const rawAndEntities = await queryBuilder.getRawAndEntities();

    if (!rawAndEntities.entities || rawAndEntities.entities.length === 0) {
      throw new NotFoundException(`브로슈어를 찾을 수 없습니다. ID: ${id}`);
    }

    const brochure = rawAndEntities.entities[0];
    const raw = rawAndEntities.raw[0];

    // raw 데이터에서 category name을 엔티티에 매핑
    if (raw && raw.category_name) {
      brochure.category = {
        name: raw.category_name,
      };
      this.logger.debug(
        `브로슈어 ${brochure.id}: 카테고리명 = ${raw.category_name}`,
      );
    } else {
      this.logger.warn(
        `브로슈어 ${brochure.id}: 카테고리명을 찾을 수 없음. categoryId: ${brochure.categoryId}`,
      );
    }

    return brochure;
  }

  /**
   * 브로슈어를 업데이트한다
   */
  async 브로슈어를_업데이트한다(
    id: string,
    data: Partial<Brochure>,
  ): Promise<Brochure> {
    this.logger.log(`브로슈어 업데이트 시작 - ID: ${id}`);

    const brochure = await this.ID로_브로슈어를_조회한다(id);

    Object.assign(brochure, data);

    const updated = await this.brochureRepository.save(brochure);

    this.logger.log(`브로슈어 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 브로슈어를 삭제한다 (Soft Delete)
   */
  async 브로슈어를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`브로슈어 삭제 시작 - ID: ${id}`);

    const brochure = await this.ID로_브로슈어를_조회한다(id);

    await this.brochureRepository.softRemove(brochure);

    this.logger.log(`브로슈어 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 브로슈어 공개 여부를 변경한다
   */
  async 브로슈어_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<Brochure> {
    this.logger.log(`브로슈어 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`);

    return await this.브로슈어를_업데이트한다(id, { isPublic, updatedBy });
  }

  /**
   * 다음 순서 번호를 계산한다
   */
  async 다음_순서를_계산한다(): Promise<number> {
    const maxOrderBrochures = await this.brochureRepository.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    });

    return maxOrderBrochures.length > 0 ? maxOrderBrochures[0].order + 1 : 0;
  }

  /**
   * 브로슈어 번역을 조회한다
   */
  async 브로슈어_번역을_조회한다(
    brochureId: string,
  ): Promise<BrochureTranslation[]> {
    this.logger.debug(`브로슈어 번역 조회 - 브로슈어 ID: ${brochureId}`);

    return await this.translationRepository.find({
      where: { brochureId },
      relations: ['language'],
    });
  }

  /**
   * 공개된 브로슈어를 조회한다
   */
  async 공개된_브로슈어를_조회한다(): Promise<Brochure[]> {
    this.logger.debug(`공개된 브로슈어 조회`);

    return await this.brochureRepository.find({
      where: {
        isPublic: true,
      },
      order: {
        order: 'ASC',
      },
      relations: ['translations', 'translations.language'],
    });
  }
}
