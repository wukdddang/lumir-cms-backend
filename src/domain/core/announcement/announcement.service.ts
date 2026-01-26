import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Announcement } from './announcement.entity';
import { AnnouncementRead } from './announcement-read.entity';

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
  async 공지사항을_생성한다(
    data: Partial<Announcement>,
  ): Promise<Announcement> {
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
    isFixed?: boolean;
    isPublic?: boolean;
  }): Promise<Announcement[]> {
    this.logger.debug(`공지사항 목록 조회`);

    const queryBuilder =
      this.announcementRepository.createQueryBuilder('announcement')
        .leftJoinAndSelect('announcement.category', 'category');

    if (options?.isFixed !== undefined) {
      queryBuilder.where('announcement.isFixed = :isFixed', {
        isFixed: options.isFixed,
      });
    }

    if (options?.isPublic !== undefined) {
      if (options?.isFixed !== undefined) {
        queryBuilder.andWhere('announcement.isPublic = :isPublic', {
          isPublic: options.isPublic,
        });
      } else {
        queryBuilder.where('announcement.isPublic = :isPublic', {
          isPublic: options.isPublic,
        });
      }
    }

    return await queryBuilder
      .orderBy('announcement.isFixed', 'DESC')
      .addOrderBy('announcement.order', 'DESC')
      .addOrderBy('announcement.createdAt', 'DESC')
      .getMany();
  }

  /**
   * ID로 공지사항을 조회한다 (설문조사 포함)
   */
  async ID로_공지사항을_조회한다(id: string): Promise<Announcement> {
    this.logger.debug(`공지사항 조회 - ID: ${id}`);

    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['survey', 'survey.questions'],
    });

    if (!announcement) {
      throw new NotFoundException(`공지사항을 찾을 수 없습니다. ID: ${id}`);
    }

    return announcement;
  }

  /**
   * 공지사항을 업데이트한다
   * @throws ConflictException 공개된 공지사항은 수정 불가
   */
  async 공지사항을_업데이트한다(
    id: string,
    data: Partial<Announcement>,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 업데이트 시작 - ID: ${id}`);

    const announcement = await this.ID로_공지사항을_조회한다(id);

    // 수정 가능 여부 검증
    this.수정_가능_여부를_검증한다(announcement);

    // 허용된 필드만 수정 (화이트리스트 방식)
    const allowedFields = [
      'categoryId',
      'title',
      'content',
      'mustRead',
      'permissionEmployeeIds',
      'permissionRankIds',
      'permissionPositionIds',
      'permissionDepartmentIds',
      'attachments',
      'releasedAt',
      'expiredAt',
    ];

    const filteredData = Object.keys(data)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    Object.assign(announcement, filteredData);

    const updated = await this.announcementRepository.save(announcement);

    this.logger.log(`공지사항 업데이트 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 공지사항을 삭제한다 (Soft Delete)
   * @throws ConflictException 공개된 공지사항은 삭제 불가
   */
  async 공지사항을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`공지사항 삭제 시작 - ID: ${id}`);

    const announcement = await this.ID로_공지사항을_조회한다(id);

    // 삭제 가능 여부 검증
    this.삭제_가능_여부를_검증한다(announcement);

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
      },
      order: {
        order: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 부서 변경 대상 목록을 조회한다
   * permissionDepartmentIds가 null이거나 빈 배열인 공지사항 목록 반환
   */
  async 부서_변경_대상_목록을_조회한다(): Promise<Announcement[]> {
    this.logger.debug(`부서 변경 대상 목록 조회`);

    const announcements = await this.announcementRepository.find({
      order: {
        createdAt: 'DESC',
      },
      relations: ['survey', 'survey.questions'],
    });

    // permissionDepartmentIds가 null이거나 빈 배열인 것만 필터링
    return announcements.filter(
      (announcement) =>
        !announcement.permissionDepartmentIds ||
        announcement.permissionDepartmentIds.length === 0,
    );
  }

  /**
   * 공지사항 공개 상태를 변경한다
   * @throws ConflictException 공개 전환 시 필수 필드 누락
   */
  async 공지사항_공개_상태를_변경한다(
    id: string,
    isPublic: boolean,
    userId?: string,
  ): Promise<Announcement> {
    this.logger.log(
      `공지사항 공개 상태 변경 시작 - ID: ${id}, isPublic: ${isPublic}`,
    );

    const announcement = await this.ID로_공지사항을_조회한다(id);

    // 비공개 → 공개 전환 시 검증
    if (isPublic && !announcement.isPublic) {
      this.공개_전환_가능_여부를_검증한다(announcement);
    }

    announcement.isPublic = isPublic;

    if (userId) {
      announcement.updatedBy = userId;
    }

    const updated = await this.announcementRepository.save(announcement);

    this.logger.log(`공지사항 공개 상태 변경 완료 - ID: ${id}`);
    return updated;
  }

  /**
   * 정렬 순서를 변경한다 (공개 상태에서도 가능)
   */
  async 정렬_순서를_변경한다(
    id: string,
    order: number,
    userId?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 정렬 순서 변경 - ID: ${id}, order: ${order}`);

    const announcement = await this.ID로_공지사항을_조회한다(id);

    announcement.order = order;

    if (userId) {
      announcement.updatedBy = userId;
    }

    return await this.announcementRepository.save(announcement);
  }

  /**
   * 고정 여부를 변경한다 (공개 상태에서도 가능)
   */
  async 고정_여부를_변경한다(
    id: string,
    isFixed: boolean,
    userId?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 고정 여부 변경 - ID: ${id}, isFixed: ${isFixed}`);

    const announcement = await this.ID로_공지사항을_조회한다(id);

    announcement.isFixed = isFixed;

    if (userId) {
      announcement.updatedBy = userId;
    }

    return await this.announcementRepository.save(announcement);
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
      throw new Error('수정할 공지사항이 최소 1개 이상 필요합니다.');
    }

    // 트랜잭션 내에서 처리
    const queryRunner =
      this.announcementRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let updatedCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    try {
      // 먼저 모든 ID가 존재하는지 확인
      const ids = announcements.map((item) => item.id);
      const existingAnnouncements = await queryRunner.manager.find(
        Announcement,
        {
          where: ids.map((id) => ({ id })),
        },
      );

      const existingIds = new Set(existingAnnouncements.map((a) => a.id));
      const missingIds = ids.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        throw new NotFoundException(
          `다음 공지사항을 찾을 수 없습니다: ${missingIds.join(', ')}`,
        );
      }

      // 각 공지사항의 순서를 업데이트
      for (const item of announcements) {
        try {
          await queryRunner.manager.update(
            Announcement,
            { id: item.id },
            {
              order: item.order,
              updatedBy,
              updatedAt: new Date(),
            },
          );
          updatedCount++;
          this.logger.debug(
            `공지사항 오더 업데이트 성공 - ID: ${item.id}, Order: ${item.order}`,
          );
        } catch (error) {
          this.logger.error(
            `공지사항 오더 업데이트 실패 - ID: ${item.id}, 에러: ${error.message}`,
          );
          errors.push({ id: item.id, error: error.message });
          // 트랜잭션이므로 하나라도 실패하면 롤백됨
          throw error;
        }
      }

      // 모두 성공하면 커밋
      await queryRunner.commitTransaction();

      this.logger.log(
        `공지사항 오더 일괄 업데이트 완료 - 수정된 수: ${updatedCount}`,
      );

      return {
        success: true,
        updatedCount,
      };
    } catch (error) {
      // 에러 발생 시 롤백
      await queryRunner.rollbackTransaction();

      // NotFoundException은 클라이언트 오류이므로 warn 레벨로 기록
      // 그 외 예상치 못한 에러는 error 레벨로 기록
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `공지사항 오더 일괄 업데이트 실패 - 롤백됨: ${error.message}`,
        );
      } else {
        this.logger.error(
          `공지사항 오더 일괄 업데이트 실패 - 롤백됨: ${error.message}`,
        );
      }

      throw error;
    } finally {
      // QueryRunner 해제
      await queryRunner.release();
    }
  }

  /**
   * 현재 공개 상태인지 확인한다
   * @private
   */
  private is현재_공개_상태(announcement: Announcement): boolean {
    if (!announcement.isPublic) {
      return false; // 비공개
    }

    const now = new Date();

    // 공개 시작 일시가 미래라면 아직 공개되지 않음 (공개 예약)
    if (announcement.releasedAt && announcement.releasedAt > now) {
      return false;
    }

    // 공개 종료 일시가 과거라도 isPublic = true면 공개 상태로 간주
    return true;
  }

  /**
   * 수정 가능 여부를 검증한다
   * @private
   * @throws ConflictException 공개된 공지사항은 수정 불가
   */
  private 수정_가능_여부를_검증한다(announcement: Announcement): void {
    // 1. 삭제된 엔티티 체크
    if (announcement.deletedAt) {
      throw new ConflictException('삭제된 공지사항은 수정할 수 없습니다');
    }

    // 2. 공개 상태 체크
    if (this.is현재_공개_상태(announcement)) {
      throw new ConflictException(
        '공개된 공지사항은 수정할 수 없습니다. 먼저 비공개로 전환해주세요.',
      );
    }
  }

  /**
   * 삭제 가능 여부를 검증한다
   * @private
   * @throws ConflictException 공개된 공지사항은 삭제 불가
   */
  private 삭제_가능_여부를_검증한다(announcement: Announcement): void {
    // 1. 이미 삭제된 엔티티 체크
    if (announcement.deletedAt) {
      throw new ConflictException('이미 삭제된 공지사항입니다');
    }

    // 2. 공개 상태 체크 (isPublic만 확인)
    if (announcement.isPublic) {
      throw new ConflictException(
        '공개된 공지사항은 삭제할 수 없습니다. 먼저 비공개로 전환해주세요.',
      );
    }
  }

  /**
   * 공개 전환 가능 여부를 검증한다
   * @private
   * @throws ConflictException 필수 필드 누락 시
   */
  private 공개_전환_가능_여부를_검증한다(announcement: Announcement): void {
    // 필수 필드 검증
    if (!announcement.title || !announcement.content) {
      throw new ConflictException(
        '제목과 내용은 필수입니다. 공개 전환 전에 입력해주세요.',
      );
    }

    if (announcement.title.length < 3) {
      throw new ConflictException('제목은 최소 3자 이상이어야 합니다.');
    }
  }
}
