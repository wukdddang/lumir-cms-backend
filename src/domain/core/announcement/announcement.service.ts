import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { AnnouncementRead } from './announcement-read.entity';
import { ContentStatus } from '../content-status.types';

/**
 * 공지사항 서비스
 * 내부 공지사항 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private readonly readRepository: Repository<AnnouncementRead>,
  ) {}

  /**
   * 공지사항을 생성한다
   */
  async 공지사항을_생성한다(data: Partial<Announcement>): Promise<Announcement> {
    this.logger.log(`공지사항 생성 시작 - 제목: ${data.title}`);

    const announcement = this.announcementRepository.create(data);
    const saved = await this.announcementRepository.save(announcement);

    this.logger.log(`공지사항 생성 완료 - ID: ${saved.id}`);
    return saved;
  }

  /**
   * 모든 공지사항을 조회한다
   */
  async 모든_공지사항을_조회한다(options?: {
    status?: ContentStatus;
    isFixed?: boolean;
    isPublic?: boolean;
  }): Promise<Announcement[]> {
    this.logger.debug(`공지사항 목록 조회`);

    const queryBuilder =
      this.announcementRepository.createQueryBuilder('announcement');

    if (options?.status) {
      queryBuilder.where('announcement.status = :status', {
        status: options.status,
      });
    }

    if (options?.isFixed !== undefined) {
      queryBuilder.andWhere('announcement.isFixed = :isFixed', {
        isFixed: options.isFixed,
      });
    }

    if (options?.isPublic !== undefined) {
      queryBuilder.andWhere('announcement.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    return await queryBuilder
      .orderBy('announcement.isFixed', 'DESC')
      .addOrderBy('announcement.order', 'DESC')
      .addOrderBy('announcement.createdAt', 'DESC')
      .getMany();
  }

  /**
   * ID로 공지사항을 조회한다
   */
  async ID로_공지사항을_조회한다(id: string): Promise<Announcement> {
    this.logger.debug(`공지사항 조회 - ID: ${id}`);

    const announcement = await this.announcementRepository.findOne({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`공지사항을 찾을 수 없습니다. ID: ${id}`);
    }

    return announcement;
  }

  /**
   * 공지사항을 업데이트한다
   */
  async 공지사항을_업데이트한다(
    id: string,
    data: Partial<Announcement>,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 업데이트 시작 - ID: ${id}`);

    const announcement = await this.ID로_공지사항을_조회한다(id);

    Object.assign(announcement, data);

    const updated = await this.announcementRepository.save(announcement);

    this.logger.log(`공지사항 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 공지사항을 삭제한다 (Soft Delete)
   */
  async 공지사항을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`공지사항 삭제 시작 - ID: ${id}`);

    const announcement = await this.ID로_공지사항을_조회한다(id);

    await this.announcementRepository.softRemove(announcement);

    this.logger.log(`공지사항 삭제 완료 - ID: ${id}`);
    return true;
  }

  /**
   * 공지사항 읽음 표시를 한다 (Lazy Creation)
   */
  async 공지사항_읽음_표시를_한다(
    announcementId: string,
    employeeId: string,
  ): Promise<AnnouncementRead> {
    this.logger.log(
      `공지사항 읽음 표시 - 공지사항: ${announcementId}, 직원: ${employeeId}`,
    );

    // 공지사항 존재 확인
    await this.ID로_공지사항을_조회한다(announcementId);

    // 이미 읽음 표시가 있는지 확인
    let read = await this.readRepository.findOne({
      where: { announcementId, employeeId },
    });

    if (read) {
      this.logger.debug(`이미 읽음 표시가 있습니다.`);
      return read;
    }

    // Lazy Creation: 읽을 때만 레코드 생성
    read = this.readRepository.create({
      announcementId,
      employeeId,
      readAt: new Date(),
    });

    const saved = await this.readRepository.save(read);

    this.logger.log(`공지사항 읽음 표시 완료`);
    return saved;
  }

  /**
   * 직원의 읽음 여부를 확인한다
   */
  async 읽음_여부를_확인한다(
    announcementId: string,
    employeeId: string,
  ): Promise<boolean> {
    const count = await this.readRepository.count({
      where: { announcementId, employeeId },
    });

    return count > 0;
  }

  /**
   * 공지사항의 읽은 사람 수를 조회한다
   */
  async 읽은_사람_수를_조회한다(announcementId: string): Promise<number> {
    return await this.readRepository.count({
      where: { announcementId },
    });
  }

  /**
   * 필독 공지사항 목록을 조회한다
   */
  async 필독_공지사항_목록을_조회한다(): Promise<Announcement[]> {
    this.logger.debug(`필독 공지사항 목록 조회`);

    return await this.announcementRepository.find({
      where: {
        mustRead: true,
        status: ContentStatus.OPENED,
        isPublic: true,
      },
      order: {
        order: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 고정 공지사항 목록을 조회한다
   */
  async 고정_공지사항_목록을_조회한다(): Promise<Announcement[]> {
    this.logger.debug(`고정 공지사항 목록 조회`);

    return await this.announcementRepository.find({
      where: {
        isFixed: true,
        status: ContentStatus.OPENED,
      },
      order: {
        order: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 공지사항 상태를 변경한다
   */
  async 공지사항_상태를_변경한다(
    id: string,
    status: ContentStatus,
    updatedBy?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 상태 변경 - ID: ${id}, 상태: ${status}`);

    return await this.공지사항을_업데이트한다(id, { status, updatedBy });
  }

  /**
   * 공지사항 오더를 일괄 업데이트한다
   */
  async 공지사항_오더를_일괄_업데이트한다(
    announcements: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `공지사항 오더 일괄 업데이트 시작 - 수정할 공지사항 수: ${announcements.length}`,
    );

    if (announcements.length === 0) {
      this.logger.warn('수정할 공지사항이 없습니다.');
      return { success: false, updatedCount: 0 };
    }

    let updatedCount = 0;

    // 각 공지사항의 순서를 업데이트
    for (const item of announcements) {
      try {
        await this.공지사항을_업데이트한다(item.id, {
          order: item.order,
          updatedBy,
        });
        updatedCount++;
      } catch (error) {
        this.logger.error(
          `공지사항 오더 업데이트 실패 - ID: ${item.id}, 에러: ${error.message}`,
        );
        // 하나가 실패해도 나머지는 계속 처리
      }
    }

    this.logger.log(`공지사항 오더 일괄 업데이트 완료 - 수정된 수: ${updatedCount}`);

    return {
      success: updatedCount > 0,
      updatedCount,
    };
  }
}
