import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareholdersMeeting } from './shareholders-meeting.entity';
import { ShareholdersMeetingTranslation } from './shareholders-meeting-translation.entity';
import { VoteResult } from './vote-result.entity';
import { ContentStatus } from '../content-status.types';

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
    status?: ContentStatus;
    isPublic?: boolean;
    orderBy?: 'order' | 'meetingDate' | 'createdAt';
  }): Promise<ShareholdersMeeting[]> {
    this.logger.debug(`주주총회 목록 조회`);

    const queryBuilder =
      this.shareholdersMeetingRepository.createQueryBuilder('meeting');

    if (options?.status) {
      queryBuilder.where('meeting.status = :status', {
        status: options.status,
      });
    }

    if (options?.isPublic !== undefined) {
      queryBuilder.andWhere('meeting.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
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
   * 주주총회 상태를 변경한다
   */
  async 주주총회_상태를_변경한다(
    id: string,
    status: ContentStatus,
    updatedBy?: string,
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 상태 변경 - ID: ${id}, 상태: ${status}`);

    return await this.주주총회를_업데이트한다(id, { status, updatedBy });
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
        status: ContentStatus.OPENED,
      },
      order: {
        meetingDate: 'DESC',
      },
      relations: [
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
}
