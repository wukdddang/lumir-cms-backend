import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectronicDisclosure } from './electronic-disclosure.entity';
import { ElectronicDisclosureTranslation } from './electronic-disclosure-translation.entity';
import { ContentStatus } from '../content-status.types';

/**
 * 전자공시 서비스
 * 전자공시 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class ElectronicDisclosureService {
  private readonly logger = new Logger(ElectronicDisclosureService.name);

  constructor(
    @InjectRepository(ElectronicDisclosure)
    private readonly electronicDisclosureRepository: Repository<ElectronicDisclosure>,
    @InjectRepository(ElectronicDisclosureTranslation)
    private readonly translationRepository: Repository<ElectronicDisclosureTranslation>,
  ) {}

  /**
   * 전자공시를 생성한다
   */
  async 전자공시를_생성한다(
    data: Partial<ElectronicDisclosure>,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 생성 시작`);

    const disclosure = this.electronicDisclosureRepository.create(data);
    const saved = await this.electronicDisclosureRepository.save(disclosure);

    this.logger.log(`전자공시 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 전자공시를 조회한다
   */
  async 모든_전자공시를_조회한다(options?: {
    status?: ContentStatus;
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
  }): Promise<ElectronicDisclosure[]> {
    this.logger.debug(`전자공시 목록 조회`);

    const queryBuilder = this.electronicDisclosureRepository.createQueryBuilder(
      'disclosure',
    );

    if (options?.status) {
      queryBuilder.where('disclosure.status = :status', {
        status: options.status,
      });
    }

    if (options?.isPublic !== undefined) {
      queryBuilder.andWhere('disclosure.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('disclosure.order', 'ASC');
    } else {
      queryBuilder.orderBy('disclosure.createdAt', 'DESC');
    }

    return await queryBuilder.getMany();
  }

  /**
   * ID로 전자공시를 조회한다
   */
  async ID로_전자공시를_조회한다(id: string): Promise<ElectronicDisclosure> {
    this.logger.debug(`전자공시 조회 - ID: ${id}`);

    const disclosure = await this.electronicDisclosureRepository.findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!disclosure) {
      throw new NotFoundException(`전자공시를 찾을 수 없습니다. ID: ${id}`);
    }

    return disclosure;
  }

  /**
   * 전자공시를 업데이트한다
   */
  async 전자공시를_업데이트한다(
    id: string,
    data: Partial<ElectronicDisclosure>,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 업데이트 시작 - ID: ${id}`);

    const disclosure = await this.ID로_전자공시를_조회한다(id);

    Object.assign(disclosure, data);

    const updated = await this.electronicDisclosureRepository.save(disclosure);

    this.logger.log(`전자공시 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 전자공시를 삭제한다 (Soft Delete)
   */
  async 전자공시를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`전자공시 삭제 시작 - ID: ${id}`);

    const disclosure = await this.ID로_전자공시를_조회한다(id);

    await this.electronicDisclosureRepository.softRemove(disclosure);

    this.logger.log(`전자공시 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 전자공시 상태를 변경한다
   */
  async 전자공시_상태를_변경한다(
    id: string,
    status: ContentStatus,
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 상태 변경 - ID: ${id}, 상태: ${status}`);

    return await this.전자공시를_업데이트한다(id, { status, updatedBy });
  }

  /**
   * 전자공시 공개 여부를 변경한다
   */
  async 전자공시_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`);

    return await this.전자공시를_업데이트한다(id, { isPublic, updatedBy });
  }

  /**
   * 다음 순서 번호를 계산한다
   */
  async 다음_순서를_계산한다(): Promise<number> {
    const maxOrderDisclosures =
      await this.electronicDisclosureRepository.find({
        order: { order: 'DESC' },
        select: ['order'],
        take: 1,
      });

    return maxOrderDisclosures.length > 0
      ? maxOrderDisclosures[0].order + 1
      : 0;
  }

  /**
   * 전자공시 번역을 조회한다
   */
  async 전자공시_번역을_조회한다(
    disclosureId: string,
  ): Promise<ElectronicDisclosureTranslation[]> {
    this.logger.debug(`전자공시 번역 조회 - 전자공시 ID: ${disclosureId}`);

    return await this.translationRepository.find({
      where: { electronicDisclosureId: disclosureId },
      relations: ['language'],
    });
  }

  /**
   * 공개된 전자공시를 조회한다
   */
  async 공개된_전자공시를_조회한다(): Promise<ElectronicDisclosure[]> {
    this.logger.debug(`공개된 전자공시 조회`);

    return await this.electronicDisclosureRepository.find({
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
