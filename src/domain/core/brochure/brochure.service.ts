import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brochure } from './brochure.entity';
import { BrochureTranslation } from './brochure-translation.entity';
import { ContentStatus } from '../content-status.types';

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
    status?: ContentStatus;
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
  }): Promise<Brochure[]> {
    this.logger.debug(`브로슈어 목록 조회`);

    const queryBuilder =
      this.brochureRepository.createQueryBuilder('brochure');

    if (options?.status) {
      queryBuilder.where('brochure.status = :status', {
        status: options.status,
      });
    }

    if (options?.isPublic !== undefined) {
      queryBuilder.andWhere('brochure.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('brochure.order', 'ASC');
    } else {
      queryBuilder.orderBy('brochure.createdAt', 'DESC');
    }

    return await queryBuilder.getMany();
  }

  /**
   * ID로 브로슈어를 조회한다
   */
  async ID로_브로슈어를_조회한다(id: string): Promise<Brochure> {
    this.logger.debug(`브로슈어 조회 - ID: ${id}`);

    const brochure = await this.brochureRepository.findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!brochure) {
      throw new NotFoundException(`브로슈어를 찾을 수 없습니다. ID: ${id}`);
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
   * 브로슈어 상태를 변경한다
   */
  async 브로슈어_상태를_변경한다(
    id: string,
    status: ContentStatus,
    updatedBy?: string,
  ): Promise<Brochure> {
    this.logger.log(`브로슈어 상태 변경 - ID: ${id}, 상태: ${status}`);

    return await this.브로슈어를_업데이트한다(id, { status, updatedBy });
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
        status: ContentStatus.OPENED,
      },
      order: {
        order: 'ASC',
      },
      relations: ['translations', 'translations.language'],
    });
  }
}
