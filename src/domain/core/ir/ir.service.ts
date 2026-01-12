import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IR } from './ir.entity';
import { IRTranslation } from './ir-translation.entity';
import { ContentStatus } from '../content-status.types';

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
    status?: ContentStatus;
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
  }): Promise<IR[]> {
    this.logger.debug(`IR 목록 조회`);

    const queryBuilder = this.irRepository.createQueryBuilder('ir');

    if (options?.status) {
      queryBuilder.where('ir.status = :status', {
        status: options.status,
      });
    }

    if (options?.isPublic !== undefined) {
      queryBuilder.andWhere('ir.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('ir.order', 'ASC');
    } else {
      queryBuilder.orderBy('ir.createdAt', 'DESC');
    }

    return await queryBuilder.getMany();
  }

  /**
   * ID로 IR을 조회한다
   */
  async ID로_IR을_조회한다(id: string): Promise<IR> {
    this.logger.debug(`IR 조회 - ID: ${id}`);

    const ir = await this.irRepository.findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!ir) {
      throw new NotFoundException(`IR을 찾을 수 없습니다. ID: ${id}`);
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
   * IR 상태를 변경한다
   */
  async IR_상태를_변경한다(
    id: string,
    status: ContentStatus,
    updatedBy?: string,
  ): Promise<IR> {
    this.logger.log(`IR 상태 변경 - ID: ${id}, 상태: ${status}`);

    return await this.IR을_업데이트한다(id, { status, updatedBy });
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
        status: ContentStatus.OPENED,
      },
      order: {
        order: 'ASC',
      },
      relations: ['translations', 'translations.language'],
    });
  }
}
