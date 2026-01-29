import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareholdersMeeting } from './shareholders-meeting.entity';
import { ShareholdersMeetingTranslation } from './shareholders-meeting-translation.entity';
import { VoteResult } from './vote-result.entity';
import { VoteResultTranslation } from './vote-result-translation.entity';

/**
 * 주주총회 서비스
 * 주주총회 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class ShareholdersMeetingService {
  private readonly logger = new Logger(ShareholdersMeetingService.name);

  constructor(
    @InjectRepository(ShareholdersMeeting)
    private readonly shareholdersMeetingRepository: Repository<ShareholdersMeeting>,
    @InjectRepository(ShareholdersMeetingTranslation)
    private readonly translationRepository: Repository<ShareholdersMeetingTranslation>,
    @InjectRepository(VoteResult)
    private readonly voteResultRepository: Repository<VoteResult>,
    @InjectRepository(VoteResultTranslation)
    private readonly voteResultTranslationRepository: Repository<VoteResultTranslation>,
  ) {}

  /**
   * 주주총회를 생성한다
   */
  async 주주총회를_생성한다(
    data: Partial<ShareholdersMeeting>,
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 생성 시작`);

    const meeting = this.shareholdersMeetingRepository.create(data);
    const saved = await this.shareholdersMeetingRepository.save(meeting);

    this.logger.log(`주주총회 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 주주총회를 조회한다
   */
  async 모든_주주총회를_조회한다(options?: {
    isPublic?: boolean;
    orderBy?: 'order' | 'meetingDate' | 'createdAt';
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
  }): Promise<ShareholdersMeeting[]> {
    this.logger.debug(`주주총회 목록 조회`);

    const queryBuilder = this.shareholdersMeetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.category', 'category');

    let hasWhere = false;

    if (options?.isPublic !== undefined) {
      queryBuilder.where('meeting.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
      hasWhere = true;
    }

    if (options?.categoryId) {
      if (hasWhere) {
        queryBuilder.andWhere('meeting.categoryId = :categoryId', {
          categoryId: options.categoryId,
        });
      } else {
        queryBuilder.where('meeting.categoryId = :categoryId', {
          categoryId: options.categoryId,
        });
        hasWhere = true;
      }
    }

    if (options?.startDate) {
      if (hasWhere) {
        queryBuilder.andWhere('meeting.createdAt >= :startDate', {
          startDate: options.startDate,
        });
      } else {
        queryBuilder.where('meeting.createdAt >= :startDate', {
          startDate: options.startDate,
        });
        hasWhere = true;
      }
    }

    if (options?.endDate) {
      if (hasWhere) {
        queryBuilder.andWhere('meeting.createdAt <= :endDate', {
          endDate: options.endDate,
        });
      } else {
        queryBuilder.where('meeting.createdAt <= :endDate', {
          endDate: options.endDate,
        });
        hasWhere = true;
      }
    }

    const orderBy = options?.orderBy || 'meetingDate';
    if (orderBy === 'order') {
      queryBuilder.orderBy('meeting.order', 'ASC');
    } else if (orderBy === 'meetingDate') {
      queryBuilder.orderBy('meeting.meetingDate', 'DESC');
    } else {
      queryBuilder.orderBy('meeting.createdAt', 'DESC');
    }

    return await queryBuilder.getMany();
  }

  /**
   * ID로 주주총회를 조회한다
   */
  async ID로_주주총회를_조회한다(id: string): Promise<ShareholdersMeeting> {
    this.logger.debug(`주주총회 조회 - ID: ${id}`);

    const meeting = await this.shareholdersMeetingRepository.findOne({
      where: { id },
      relations: [
        'category',
        'translations',
        'translations.language',
        'voteResults',
        'voteResults.translations',
        'voteResults.translations.language',
      ],
    });

    if (!meeting) {
      throw new NotFoundException(`주주총회를 찾을 수 없습니다. ID: ${id}`);
    }

    return meeting;
  }

  /**
   * 주주총회를 업데이트한다
   */
  async 주주총회를_업데이트한다(
    id: string,
    data: Partial<ShareholdersMeeting>,
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 업데이트 시작 - ID: ${id}`);

    const meeting = await this.ID로_주주총회를_조회한다(id);

    Object.assign(meeting, data);

    const updated = await this.shareholdersMeetingRepository.save(meeting);

    this.logger.log(`주주총회 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 주주총회를 삭제한다 (Soft Delete)
   */
  async 주주총회를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`주주총회 삭제 시작 - ID: ${id}`);

    const meeting = await this.ID로_주주총회를_조회한다(id);

    await this.shareholdersMeetingRepository.softRemove(meeting);

    this.logger.log(`주주총회 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 주주총회 공개 여부를 변경한다
   */
  async 주주총회_공개_여부를_변경한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 공개 여부 변경 - ID: ${id}, 공개: ${isPublic}`);

    return await this.주주총회를_업데이트한다(id, { isPublic, updatedBy });
  }

  /**
   * 다음 순서 번호를 계산한다
   */
  async 다음_순서를_계산한다(): Promise<number> {
    const maxOrderMeetings = await this.shareholdersMeetingRepository.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    });

    return maxOrderMeetings.length > 0 ? maxOrderMeetings[0].order + 1 : 0;
  }

  /**
   * 주주총회 번역을 조회한다
   */
  async 주주총회_번역을_조회한다(
    meetingId: string,
  ): Promise<ShareholdersMeetingTranslation[]> {
    this.logger.debug(`주주총회 번역 조회 - 주주총회 ID: ${meetingId}`);

    return await this.translationRepository.find({
      where: { shareholdersMeetingId: meetingId },
      relations: ['language'],
    });
  }

  /**
   * 공개된 주주총회를 조회한다
   */
  async 공개된_주주총회를_조회한다(): Promise<ShareholdersMeeting[]> {
    this.logger.debug(`공개된 주주총회 조회`);

    return await this.shareholdersMeetingRepository.find({
      where: {
        isPublic: true,
      },
      order: {
        meetingDate: 'DESC',
      },
      relations: [
        'category',
        'translations',
        'translations.language',
        'voteResults',
        'voteResults.translations',
      ],
    });
  }

  /**
   * 주주총회의 의결 결과를 조회한다
   */
  async 의결_결과를_조회한다(meetingId: string): Promise<VoteResult[]> {
    this.logger.debug(`의결 결과 조회 - 주주총회 ID: ${meetingId}`);

    return await this.voteResultRepository.find({
      where: { shareholdersMeetingId: meetingId },
      relations: ['translations', 'translations.language'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 주주총회 번역을 생성한다
   */
  async 주주총회_번역을_생성한다(
    meetingId: string,
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
      isSynced?: boolean;
    }>,
    createdBy?: string,
  ): Promise<ShareholdersMeetingTranslation[]> {
    this.logger.log(
      `주주총회 번역 생성 시작 - 주주총회 ID: ${meetingId}, 번역 수: ${translations.length}`,
    );

    const translationEntities = translations.map((translation) =>
      this.translationRepository.create({
        shareholdersMeetingId: meetingId,
        languageId: translation.languageId,
        title: translation.title,
        description: translation.description,
        isSynced: translation.isSynced ?? false,
        createdBy,
      }),
    );

    const saved = await this.translationRepository.save(translationEntities);

    this.logger.log(`주주총회 번역 생성 완료 - ${saved.length}개 생성됨`);
    return saved;
  }

  /**
   * 주주총회 번역을 업데이트한다
   */
  async 주주총회_번역을_업데이트한다(
    translationId: string,
    data: {
      title?: string;
      description?: string;
      isSynced?: boolean;
      updatedBy?: string;
    },
  ): Promise<ShareholdersMeetingTranslation> {
    this.logger.log(`주주총회 번역 업데이트 시작 - 번역 ID: ${translationId}`);

    const translation = await this.translationRepository.findOne({
      where: { id: translationId },
    });

    if (!translation) {
      throw new NotFoundException(
        `번역을 찾을 수 없습니다. ID: ${translationId}`,
      );
    }

    Object.assign(translation, data);

    const updated = await this.translationRepository.save(translation);

    this.logger.log(`주주총회 번역 업데이트 완료 - 번역 ID: ${translationId}`);
    return updated;
  }

  /**
   * 주주총회 오더를 일괄 업데이트한다
   */
  async 주주총회_오더를_일괄_업데이트한다(
    items: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `주주총회 일괄 오더 업데이트 시작 - 항목 수: ${items.length}`,
    );

    let updatedCount = 0;

    for (const item of items) {
      await this.주주총회를_업데이트한다(item.id, {
        order: item.order,
        updatedBy,
      });
      updatedCount++;
    }

    this.logger.log(
      `주주총회 일괄 오더 업데이트 완료 - 업데이트된 항목 수: ${updatedCount}`,
    );

    return {
      success: true,
      updatedCount,
    };
  }

  /**
   * 의결 결과(안건)를 생성한다
   */
  async 의결_결과를_생성한다(
    meetingId: string,
    voteResultData: Partial<VoteResult>,
  ): Promise<VoteResult> {
    this.logger.log(
      `의결 결과 생성 시작 - 주주총회 ID: ${meetingId}, 안건 번호: ${voteResultData.agendaNumber}`,
    );

    const voteResult = this.voteResultRepository.create({
      ...voteResultData,
      shareholdersMeetingId: meetingId,
    });

    const saved = await this.voteResultRepository.save(voteResult);

    this.logger.log(`의결 결과 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 의결 결과(안건)를 업데이트한다
   */
  async 의결_결과를_업데이트한다(
    voteResultId: string,
    data: Partial<VoteResult>,
  ): Promise<VoteResult> {
    this.logger.log(`의결 결과 업데이트 시작 - ID: ${voteResultId}`);

    const voteResult = await this.voteResultRepository.findOne({
      where: { id: voteResultId },
    });

    if (!voteResult) {
      throw new NotFoundException(
        `의결 결과를 찾을 수 없습니다. ID: ${voteResultId}`,
      );
    }

    Object.assign(voteResult, data);

    const updated = await this.voteResultRepository.save(voteResult);

    this.logger.log(`의결 결과 업데이트 완료 - ID: ${voteResultId}`);
    return updated;
  }

  /**
   * 의결 결과(안건)를 삭제한다
   */
  async 의결_결과를_삭제한다(voteResultId: string): Promise<boolean> {
    this.logger.log(`의결 결과 삭제 시작 - ID: ${voteResultId}`);

    const voteResult = await this.voteResultRepository.findOne({
      where: { id: voteResultId },
    });

    if (!voteResult) {
      throw new NotFoundException(
        `의결 결과를 찾을 수 없습니다. ID: ${voteResultId}`,
      );
    }

    await this.voteResultRepository.softRemove(voteResult);

    this.logger.log(`의결 결과 삭제 완료 - ID: ${voteResultId}`);
    return true;
  }

  /**
   * 의결 결과 번역을 생성한다
   */
  async 의결_결과_번역을_생성한다(
    voteResultId: string,
    translations: Array<{
      languageId: string;
      title: string;
      isSynced?: boolean;
    }>,
    createdBy?: string,
  ): Promise<VoteResultTranslation[]> {
    this.logger.log(
      `의결 결과 번역 생성 시작 - 의결 결과 ID: ${voteResultId}, 번역 수: ${translations.length}`,
    );

    const translationEntities = translations.map((translation) =>
      this.voteResultTranslationRepository.create({
        voteResultId,
        languageId: translation.languageId,
        title: translation.title,
        isSynced: translation.isSynced ?? false,
        createdBy,
      }),
    );

    const saved =
      await this.voteResultTranslationRepository.save(translationEntities);

    this.logger.log(`의결 결과 번역 생성 완료 - ${saved.length}개 생성됨`);
    return saved;
  }

  /**
   * 의결 결과 번역을 업데이트한다
   */
  async 의결_결과_번역을_업데이트한다(
    translationId: string,
    data: {
      title?: string;
      isSynced?: boolean;
      updatedBy?: string;
    },
  ): Promise<VoteResultTranslation> {
    this.logger.log(`의결 결과 번역 업데이트 시작 - 번역 ID: ${translationId}`);

    const translation = await this.voteResultTranslationRepository.findOne({
      where: { id: translationId },
    });

    if (!translation) {
      throw new NotFoundException(
        `번역을 찾을 수 없습니다. ID: ${translationId}`,
      );
    }

    Object.assign(translation, data);

    const updated =
      await this.voteResultTranslationRepository.save(translation);

    this.logger.log(`의결 결과 번역 업데이트 완료 - 번역 ID: ${translationId}`);
    return updated;
  }

  /**
   * 의결 결과 번역을 조회한다
   */
  async 의결_결과_번역을_조회한다(
    voteResultId: string,
  ): Promise<VoteResultTranslation[]> {
    this.logger.debug(`의결 결과 번역 조회 - 의결 결과 ID: ${voteResultId}`);

    return await this.voteResultTranslationRepository.find({
      where: { voteResultId },
      relations: ['language'],
    });
  }
}
