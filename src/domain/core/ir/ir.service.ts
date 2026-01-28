import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IR } from './ir.entity';
import { IRTranslation } from './ir-translation.entity';

/**
 * IR 서비스
 * IR 자료 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class IRService {
  private readonly logger = new Logger(IRService.name);

  constructor(
    @InjectRepository(IR)
    private readonly irRepository: Repository<IR>,
    @InjectRepository(IRTranslation)
    private readonly translationRepository: Repository<IRTranslation>,
  ) {}

  /**
   * IR을 생성한다
   */
  async IR을_생성한다(data: Partial<IR>): Promise<IR> {
    this.logger.log(`IR 생성 시작`);

    const ir = this.irRepository.create(data);
    const saved = await this.irRepository.save(ir);

    this.logger.log(`IR 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 IR을 조회한다
   */
  async 모든_IR을_조회한다(options?: {
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
    startDate?: Date;
    endDate?: Date;
  }): Promise<IR[]> {
    this.logger.debug(`IR 목록 조회`);

    const queryBuilder = this.irRepository
      .createQueryBuilder('ir')
      .leftJoinAndSelect('ir.translations', 'translations')
      .leftJoinAndSelect('translations.language', 'language');

    // category 조인
    queryBuilder.leftJoin('categories', 'category', 'ir.categoryId = category.id');
    queryBuilder.addSelect(['category.name']);

    let hasWhere = false;

    if (options?.isPublic !== undefined) {
      queryBuilder.where('ir.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
      hasWhere = true;
    }

    if (options?.startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('ir.createdAt >= :startDate', { startDate: options.startDate });
      } else {
        queryBuilder.where('ir.createdAt >= :startDate', { startDate: options.startDate });
        hasWhere = true;
      }
    }

    if (options?.endDate) {
      if (hasWhere) {
        queryBuilder.andWhere('ir.createdAt <= :endDate', { endDate: options.endDate });
      } else {
        queryBuilder.where('ir.createdAt <= :endDate', { endDate: options.endDate });
        hasWhere = true;
      }
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('ir.order', 'ASC');
    } else {
      queryBuilder.orderBy('ir.createdAt', 'DESC');
    }

    const rawAndEntities = await queryBuilder.getRawAndEntities();
    const items = rawAndEntities.entities;
    const raw = rawAndEntities.raw;

    // raw 데이터에서 category name을 엔티티에 매핑
    // 주의: translations를 leftJoinAndSelect하면 각 IR마다 여러 row가 생기므로
    // ir.id를 기준으로 raw 데이터를 찾아야 함
    items.forEach((ir) => {
      const matchingRaw = raw.find((r) => r.ir_id === ir.id);
      if (matchingRaw && matchingRaw.category_name) {
        ir.category = {
          name: matchingRaw.category_name,
        };
      }
    });

    return items;
  }

  /**
   * ID로 IR을 조회한다
   */
  async ID로_IR을_조회한다(id: string): Promise<IR> {
    this.logger.debug(`IR 조회 - ID: ${id}`);

    const queryBuilder = this.irRepository
      .createQueryBuilder('ir')
      .leftJoinAndSelect('ir.translations', 'translations')
      .leftJoinAndSelect('translations.language', 'language')
      .leftJoin('categories', 'category', 'ir.categoryId = category.id')
      .addSelect(['category.name'])
      .where('ir.id = :id', { id });

    const rawAndEntities = await queryBuilder.getRawAndEntities();

    if (!rawAndEntities.entities || rawAndEntities.entities.length === 0) {
      throw new NotFoundException(`IR을 찾을 수 없습니다. ID: ${id}`);
    }

    const ir = rawAndEntities.entities[0];
    const raw = rawAndEntities.raw[0];

    // raw 데이터에서 category name을 엔티티에 매핑
    if (raw && raw.category_name) {
      ir.category = {
        name: raw.category_name,
      };
      this.logger.debug(`IR ${ir.id}: 카테고리명 = ${raw.category_name}`);
    } else {
      this.logger.warn(`IR ${ir.id}: 카테고리명을 찾을 수 없음. categoryId: ${ir.categoryId}`);
    }

    return ir;
  }

  /**
   * IR을 업데이트한다
   */
  async IR을_업데이트한다(id: string, data: Partial<IR>): Promise<IR> {
    this.logger.log(`IR 업데이트 시작 - ID: ${id}`);

    const ir = await this.ID로_IR을_조회한다(id);

    Object.assign(ir, data);

    const updated = await this.irRepository.save(ir);

    this.logger.log(`IR 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * IR을 삭제한다 (Soft Delete)
   */
  async IR을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`IR 삭제 시작 - ID: ${id}`);

    const ir = await this.ID로_IR을_조회한다(id);

    await this.irRepository.softRemove(ir);

    this.logger.log(`IR 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * IR 공개 여부를 변경한다
   */
  async IR_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<IR> {
    this.logger.log(`IR 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`);

    return await this.IR을_업데이트한다(id, { isPublic, updatedBy });
  }

  /**
   * 다음 순서 번호를 계산한다
   */
  async 다음_순서를_계산한다(): Promise<number> {
    const maxOrderIRs = await this.irRepository.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    });

    return maxOrderIRs.length > 0 ? maxOrderIRs[0].order + 1 : 0;
  }

  /**
   * IR 번역을 조회한다
   */
  async IR_번역을_조회한다(irId: string): Promise<IRTranslation[]> {
    this.logger.debug(`IR 번역 조회 - IR ID: ${irId}`);

    return await this.translationRepository.find({
      where: { irId },
      relations: ['language'],
    });
  }

  /**
   * 공개된 IR을 조회한다
   */
  async 공개된_IR을_조회한다(): Promise<IR[]> {
    this.logger.debug(`공개된 IR 조회`);

    return await this.irRepository.find({
      where: {
        isPublic: true,
      },
      order: {
        order: 'ASC',
      },
      relations: ['translations', 'translations.language'],
    });
  }

  /**
   * IR 번역을 생성한다
   */
  async IR_번역을_생성한다(
    irId: string,
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
      isSynced?: boolean;
    }>,
    createdBy?: string,
  ): Promise<void> {
    this.logger.log(
      `IR 번역 생성 시작 - IR ID: ${irId}, 번역 수: ${translations.length}`,
    );

    for (const translation of translations) {
      const newTranslation = this.translationRepository.create({
        irId,
        languageId: translation.languageId,
        title: translation.title,
        description: translation.description || null,
        isSynced: translation.isSynced ?? false,
        createdBy,
      });
      await this.translationRepository.save(newTranslation);
    }

    this.logger.log(`IR 번역 생성 완료 - ${translations.length}개`);
  }

  /**
   * IR 번역을 업데이트한다
   */
  async IR_번역을_업데이트한다(
    translationId: string,
    data: {
      title?: string;
      description?: string;
      isSynced?: boolean;
      updatedBy?: string;
    },
  ): Promise<void> {
    this.logger.log(`IR 번역 업데이트 - ID: ${translationId}`);

    await this.translationRepository.update(translationId, data);
  }

  /**
   * IR 오더를 일괄 업데이트한다
   */
  async IR_오더를_일괄_업데이트한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(`IR 일괄 순서 수정 시작 - 수정할 IR 수: ${items.length}`);

    if (items.length === 0) {
      throw new BadRequestException('수정할 IR이 없습니다.');
    }

    // IR ID 목록 추출 (중복 제거)
    const uniqueIrIds = [...new Set(items.map((item) => item.id))];

    // IR 조회
    const existingIRs = await this.irRepository.find({
      where: { id: In(uniqueIrIds) },
    });

    // 존재하지 않는 ID 확인 (unique ID 개수와 비교)
    if (existingIRs.length !== uniqueIrIds.length) {
      const foundIds = existingIRs.map((ir) => ir.id);
      const missingIds = uniqueIrIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `일부 IR을 찾을 수 없습니다. 누락된 ID: ${missingIds.join(', ')}`,
      );
    }

    // 순서 업데이트를 위한 맵 생성
    const orderMap = new Map<string, number>();
    items.forEach((item) => {
      orderMap.set(item.id, item.order);
    });

    // 각 IR의 순서 업데이트
    const updatePromises = existingIRs.map((ir) => {
      const newOrder = orderMap.get(ir.id);
      if (newOrder !== undefined) {
        ir.order = newOrder;
        if (updatedBy) {
          ir.updatedBy = updatedBy;
        }
      }
      return this.irRepository.save(ir);
    });

    await Promise.all(updatePromises);

    this.logger.log(
      `IR 일괄 순서 수정 완료 - 수정된 IR 수: ${existingIRs.length}`,
    );

    return {
      success: true,
      updatedCount: existingIRs.length,
    };
  }
}
