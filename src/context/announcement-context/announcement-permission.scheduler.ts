import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { AnnouncementPermissionLog } from '@domain/core/announcement/announcement-permission-log.entity';
import { AnnouncementPermissionAction } from '@domain/core/announcement/announcement-permission-action.types';
import { SsoService } from '@domain/common/sso/sso.service';

/**
 * 공지사항 권한 검증 스케줄러
 *
 * 매일 새벽 3시에 모든 공지사항의 권한을 검증하고,
 * SSO 시스템에서 삭제된 부서/직원 정보가 있으면 로그를 남깁니다.
 */
@Injectable()
export class AnnouncementPermissionScheduler {
  private readonly logger = new Logger(AnnouncementPermissionScheduler.name);

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(AnnouncementPermissionLog)
    private readonly permissionLogRepository: Repository<AnnouncementPermissionLog>,
    private readonly ssoService: SsoService,
  ) {}

  /**
   * 매일 새벽 3시에 모든 공지사항의 권한을 검증한다
   * 
   * 수동 실행이 필요한 경우 관리자 API를 통해 즉시 실행 가능
   */
  @Cron('0 3 * * *') // 매일 새벽 3시
  async 모든_공지사항_권한을_검증한다() {
    this.logger.log('공지사항 권한 검증 스케줄러 시작');

    try {
      // 모든 공지사항 조회 (Soft Delete되지 않은 것만)
      const announcements = await this.announcementRepository.find({
        where: { deletedAt: IsNull() },
      });

      this.logger.log(`검증 대상 공지사항: ${announcements.length}개`);

      let processedCount = 0;
      let invalidCount = 0;

      // 각 공지사항의 권한 검증
      for (const announcement of announcements) {
        const hasInvalid = await this.공지사항_권한을_검증한다(announcement);
        if (hasInvalid) {
          invalidCount++;
        }
        processedCount++;
      }

      this.logger.log(
        `공지사항 권한 검증 완료 - 처리: ${processedCount}개, 무효 발견: ${invalidCount}개`,
      );
    } catch (error) {
      this.logger.error('공지사항 권한 검증 중 오류 발생', error);
      throw error;
    }
  }

  /**
   * 개별 공지사항의 권한을 검증한다
   */
  private async 공지사항_권한을_검증한다(
    announcement: Announcement,
  ): Promise<boolean> {
    const hasDepartments =
      announcement.permissionDepartmentIds &&
      announcement.permissionDepartmentIds.length > 0;
    const hasEmployees =
      announcement.permissionEmployeeIds &&
      announcement.permissionEmployeeIds.length > 0;

    if (!hasDepartments && !hasEmployees) {
      // 부서/직원 권한이 없으면 검증할 필요 없음
      return false;
    }

    let invalidDepartments: Array<{ id: string; name: string | null }> = [];
    let invalidEmployees: Array<{ id: string; name: string | null }> = [];
    let validDepartments: Array<{ id: string; name: string | null }> = [];
    let validEmployees: Array<{ id: string; name: string | null }> = [];

    // 부서 정보 검증
    if (hasDepartments) {
      const departmentInfoMap =
        await this.ssoService.부서_정보_목록을_조회한다(
          announcement.permissionDepartmentIds!,
        );

      for (const departmentId of announcement.permissionDepartmentIds!) {
        const info = departmentInfoMap.get(departmentId);
        if (info) {
          validDepartments.push({ id: departmentId, name: info.name });
        } else {
          invalidDepartments.push({ id: departmentId, name: null });
        }
      }
    }

    // 직원 정보 검증
    if (hasEmployees) {
      const employeeInfoMap = await this.ssoService.직원_정보_목록을_조회한다(
        announcement.permissionEmployeeIds!,
      );

      for (const employeeId of announcement.permissionEmployeeIds!) {
        const info = employeeInfoMap.get(employeeId);
        if (info) {
          validEmployees.push({ id: employeeId, name: info.name });
        } else {
          invalidEmployees.push({ id: employeeId, name: null });
        }
      }
    }

    // 무효한 데이터가 없으면 종료
    if (
      invalidDepartments.length === 0 &&
      invalidEmployees.length === 0
    ) {
      return false;
    }

    // 이미 처리되지 않은 로그가 있는지 확인 (중복 로그 방지)
    const existingLog = await this.permissionLogRepository.findOne({
      where: {
        announcementId: announcement.id,
        action: AnnouncementPermissionAction.DETECTED,
        resolvedAt: IsNull(),
      },
      order: { detectedAt: 'DESC' },
    });

    if (existingLog) {
      this.logger.debug(
        `공지사항 "${announcement.title}" (ID: ${announcement.id})에 ` +
          `이미 미해결 로그가 존재하여 스킵합니다.`,
      );
      return false;
    }

    this.logger.warn(
      `공지사항 "${announcement.title}" (ID: ${announcement.id})에서 ` +
        `무효한 부서 ${invalidDepartments.length}개, 직원 ${invalidEmployees.length}개 발견`,
    );

    // 변경 전 스냅샷 (ID와 이름 모두 포함)
    const originalSnapshot = {
      permissionRankIds: announcement.permissionRankIds,
      permissionPositionIds: announcement.permissionPositionIds,
      permissionDepartments: [
        ...validDepartments,
        ...invalidDepartments,
      ],
      permissionEmployees: [
        ...validEmployees,
        ...invalidEmployees,
      ],
    };

    // DETECTED 로그 생성
    await this.permissionLogRepository.save({
      announcementId: announcement.id,
      invalidDepartments:
        invalidDepartments.length > 0 ? invalidDepartments : null,
      invalidEmployees:
        invalidEmployees.length > 0 ? invalidEmployees : null,
      invalidRankCodes: null,
      invalidPositionCodes: null,
      snapshotPermissions: originalSnapshot,
      action: AnnouncementPermissionAction.DETECTED,
      note: this.생성_감지_메모(invalidDepartments, invalidEmployees),
      detectedAt: new Date(),
    });

    // 공지사항에서 무효한 데이터 제거
    if (invalidDepartments.length > 0) {
      announcement.permissionDepartmentIds = validDepartments.map(
        (d) => d.id,
      );
    }
    if (invalidEmployees.length > 0) {
      announcement.permissionEmployeeIds = validEmployees.map((e) => e.id);
    }
    await this.announcementRepository.save(announcement);

    // REMOVED 로그 생성
    await this.permissionLogRepository.save({
      announcementId: announcement.id,
      invalidDepartments:
        invalidDepartments.length > 0 ? invalidDepartments : null,
      invalidEmployees:
        invalidEmployees.length > 0 ? invalidEmployees : null,
      invalidRankCodes: null,
      invalidPositionCodes: null,
      snapshotPermissions: originalSnapshot,
      action: AnnouncementPermissionAction.REMOVED,
      note: '무효한 권한 데이터 자동 제거 완료',
      detectedAt: new Date(),
    });

    // 관리자에게 알림
    this.관리자에게_알림을_전송한다(
      announcement,
      invalidDepartments,
      invalidEmployees,
    );

    // NOTIFIED 로그 생성
    await this.permissionLogRepository.save({
      announcementId: announcement.id,
      invalidDepartments:
        invalidDepartments.length > 0 ? invalidDepartments : null,
      invalidEmployees:
        invalidEmployees.length > 0 ? invalidEmployees : null,
      invalidRankCodes: null,
      invalidPositionCodes: null,
      snapshotPermissions: originalSnapshot,
      action: AnnouncementPermissionAction.NOTIFIED,
      note: '관리자에게 알림 전송 완료',
      detectedAt: new Date(),
    });

    return true;
  }

  /**
   * 감지 메모를 생성한다
   */
  private 생성_감지_메모(
    invalidDepartments: Array<{ id: string; name: string | null }>,
    invalidEmployees: Array<{ id: string; name: string | null }>,
  ): string {
    const messages: string[] = [];

    if (invalidDepartments.length > 0) {
      messages.push(
        `부서 정보 없음: ${invalidDepartments.map((d) => d.id).join(', ')}`,
      );
    }

    if (invalidEmployees.length > 0) {
      messages.push(
        `직원 정보 없음: ${invalidEmployees.map((e) => e.id).join(', ')}`,
      );
    }

    return `SSO에서 ${messages.join(', ')}`;
  }

  /**
   * 관리자에게 권한 변경 알림을 전송한다
   */
  private 관리자에게_알림을_전송한다(
    announcement: Announcement,
    invalidDepartments: Array<{ id: string; name: string | null }>,
    invalidEmployees: Array<{ id: string; name: string | null }>,
  ) {
    // TODO: 실제 알림 서비스 연동 필요 (이메일, 슬랙 등)
    this.logger.warn(
      `[알림] 공지사항 "${announcement.title}" (ID: ${announcement.id})의 권한이 무효화되었습니다.`,
    );

    if (invalidDepartments.length > 0) {
      this.logger.warn(
        `  - 무효 부서: ${invalidDepartments.map((d) => `${d.id}${d.name ? ` (${d.name})` : ''}`).join(', ')}`,
      );
    }

    if (invalidEmployees.length > 0) {
      this.logger.warn(
        `  - 무효 직원: ${invalidEmployees.map((e) => `${e.id}${e.name ? ` (${e.name})` : ''}`).join(', ')}`,
      );
    }
  }
}
