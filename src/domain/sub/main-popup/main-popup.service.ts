import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MainPopup } from './main-popup.entity';
import { MainPopupTranslation } from './main-popup-translation.entity';

/**
 * MainPopup 서비스
 * 메인 팝업 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class MainPopupService {
  private readonly logger = new Logger(MainPopupService.name);

  constructor(
    @InjectRepository(MainPopup)
    private readonly mainPopupRepository: Repository<MainPopup>,
    @InjectRepository(MainPopupTranslation)
    private readonly translationRepository: Repository<MainPopupTranslation>,
  ) {}

  /**
   * 메인 팝업을 생성한다
   */
  async 메인_팝업을_생성한다(data: Partial<MainPopup>): Promise<MainPopup> {
    this.logger.log(`메인 팝업 생성 시작`);

    const popup = this.mainPopupRepository.create(data);
    const saved = await this.mainPopupRepository.save(popup);

    this.logger.log(`메인 팝업 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 메인 팝업을 조회한다
   */
  async 모든_메인_팝업을_조회한다(options?: {
    isPublic?: boolean;
    orderBy?: 'order' | 'createdAt';
    startDate?: Date;
    endDate?: Date;
  }): Promise<MainPopup[]> {
    this.logger.debug(`메인 팝업 목록 조회`);

    const queryBuilder = this.mainPopupRepository
      .createQueryBuilder('popup')
      .leftJoinAndSelect('popup.translations', 'translations')
      .leftJoinAndSelect('translations.language', 'language');

    let hasWhere = false;

    if (options?.isPublic !== undefined) {
      queryBuilder.where('popup.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
      hasWhere = true;
    }

    if (options?.startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('popup.createdAt >= :startDate', { startDate: options.startDate });
      } else {
        queryBuilder.where('popup.createdAt >= :startDate', { startDate: options.startDate });
        hasWhere = true;
      }
    }

    if (options?.endDate) {
      if (hasWhere) {
        queryBuilder.andWhere('popup.createdAt <= :endDate', { endDate: options.endDate });
      } else {
        queryBuilder.where('popup.createdAt <= :endDate', { endDate: options.endDate });
        hasWhere = true;
      }
    }

    const orderBy = options?.orderBy || 'order';
    if (orderBy === 'order') {
      queryBuilder.orderBy('popup.order', 'ASC');
    } else {
      queryBuilder.orderBy('popup.createdAt', 'DESC');
    }

    return await queryBuilder.getMany();
  }

  /**
   * ID로 메인 팝업을 조회한다
   */
  async ID로_메인_팝업을_조회한다(id: string): Promise<MainPopup> {
    this.logger.debug(`메인 팝업 조회 - ID: ${id}`);

    const popup = await this.mainPopupRepository.findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!popup) {
      throw new NotFoundException(`메인 팝업을 찾을 수 없습니다. ID: ${id}`);
    }

    return popup;
  }

  /**
   * 메인 팝업을 업데이트한다
   */
  async 메인_팝업을_업데이트한다(
    id: string,
    data: Partial<MainPopup>,
  ): Promise<MainPopup> {
    this.logger.log(`메인 팝업 업데이트 시작 - ID: ${id}`);

    const popup = await this.ID로_메인_팝업을_조회한다(id);

    Object.assign(popup, data);

    const updated = await this.mainPopupRepository.save(popup);

    this.logger.log(`메인 팝업 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 메인 팝업을 삭제한다 (Soft Delete)
   */
  async 메인_팝업을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`메인 팝업 삭제 시작 - ID: ${id}`);

    const popup = await this.ID로_메인_팝업을_조회한다(id);

    await this.mainPopupRepository.softRemove(popup);

    this.logger.log(`메인 팝업 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 메인 팝업 공개 여부를 변경한다
   */
  async 메인_팝업_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<MainPopup> {
    this.logger.log(`메인 팝업 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`);

    return await this.메인_팝업을_업데이트한다(id, { isPublic, updatedBy });
  }

  /**
   * 다음 순서 번호를 계산한다
   */
  async 다음_순서를_계산한다(): Promise<number> {
    const maxOrderPopups = await this.mainPopupRepository.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    });

    return maxOrderPopups.length > 0 ? maxOrderPopups[0].order + 1 : 0;
  }

  /**
   * 메인 팝업 번역을 조회한다
   */
  async 메인_팝업_번역을_조회한다(
    mainPopupId: string,
  ): Promise<MainPopupTranslation[]> {
    this.logger.debug(`메인 팝업 번역 조회 - 메인 팝업 ID: ${mainPopupId}`);

    return await this.translationRepository.find({
      where: { mainPopupId },
      relations: ['language'],
    });
  }

  /**
   * 공개된 메인 팝업을 조회한다
   */
  async 공개된_메인_팝업을_조회한다(): Promise<MainPopup[]> {
    this.logger.debug(`공개된 메인 팝업 조회`);

    return await this.mainPopupRepository.find({
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
   * 메인 팝업 번역을 생성한다
   */
  async 메인_팝업_번역을_생성한다(
    mainPopupId: string,
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
      isSynced?: boolean;
    }>,
    createdBy?: string,
  ): Promise<void> {
    this.logger.log(
      `메인 팝업 번역 생성 시작 - 메인 팝업 ID: ${mainPopupId}, 번역 수: ${translations.length}`,
    );

    for (const translation of translations) {
      const newTranslation = this.translationRepository.create({
        mainPopupId,
        languageId: translation.languageId,
        title: translation.title,
        description: translation.description || null,
        isSynced: translation.isSynced ?? false,
        createdBy,
      });
      await this.translationRepository.save(newTranslation);
    }

    this.logger.log(`메인 팝업 번역 생성 완료 - ${translations.length}개`);
  }

  /**
   * 메인 팝업 번역을 업데이트한다
   */
  async 메인_팝업_번역을_업데이트한다(
    translationId: string,
    data: {
      title?: string;
      description?: string;
      updatedBy?: string;
    },
  ): Promise<void> {
    this.logger.log(`메인 팝업 번역 업데이트 - ID: ${translationId}`);

    // 엔티티를 조회하고 업데이트
    const translation = await this.translationRepository.findOne({
      where: { id: translationId },
    });

    if (!translation) {
      throw new NotFoundException(`번역을 찾을 수 없습니다: ${translationId}`);
    }

    // 값 업데이트
    if (data.title !== undefined) {
      translation.title = data.title;
    }
    if (data.description !== undefined) {
      translation.description = data.description;
    }
    if (data.updatedBy !== undefined) {
      translation.updatedBy = data.updatedBy;
    }

    await this.translationRepository.save(translation);
  }

  /**
   * 메인 팝업 오더를 일괄 업데이트한다
   */
  async 메인_팝업_오더를_일괄_업데이트한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `메인 팝업 일괄 순서 수정 시작 - 수정할 메인 팝업 수: ${items.length}`,
    );

    if (!items || items.length === 0) {
      throw new BadRequestException('수정할 메인 팝업이 없습니다.');
    }

    // ID와 order 필드 검증
    for (const item of items) {
      if (!item.id) {
        throw new BadRequestException('메인 팝업 ID는 필수입니다.');
      }
      if (item.order === undefined || item.order === null) {
        throw new BadRequestException('순서(order)는 필수입니다.');
      }
      if (typeof item.order !== 'number') {
        throw new BadRequestException('순서(order)는 숫자여야 합니다.');
      }
      if (item.order < 0) {
        throw new BadRequestException('순서(order)는 0 이상이어야 합니다.');
      }
    }

    // 메인 팝업 ID 목록 추출 (중복 제거)
    const uniquePopupIds = [...new Set(items.map((item) => item.id))];

    // 메인 팝업 조회
    const existingPopups = await this.mainPopupRepository.find({
      where: { id: In(uniquePopupIds) },
    });

    // 존재하지 않는 ID 확인 (unique ID 개수와 비교)
    if (existingPopups.length !== uniquePopupIds.length) {
      const foundIds = existingPopups.map((popup) => popup.id);
      const missingIds = uniquePopupIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `다음 메인 팝업을 찾을 수 없습니다: ${missingIds.join(', ')}`,
      );
    }

    // 순서 업데이트를 위한 맵 생성
    const orderMap = new Map<string, number>();
    items.forEach((item) => {
      orderMap.set(item.id, item.order);
    });

    // 각 메인 팝업의 순서 업데이트
    const updatePromises = existingPopups.map((popup) => {
      const newOrder = orderMap.get(popup.id);
      if (newOrder !== undefined) {
        popup.order = newOrder;
        if (updatedBy) {
          popup.updatedBy = updatedBy;
        }
      }
      return this.mainPopupRepository.save(popup);
    });

    await Promise.all(updatePromises);

    this.logger.log(
      `메인 팝업 일괄 순서 수정 완료 - 수정된 메인 팝업 수: ${existingPopups.length}`,
    );

    return {
      success: true,
      updatedCount: existingPopups.length,
    };
  }
}
