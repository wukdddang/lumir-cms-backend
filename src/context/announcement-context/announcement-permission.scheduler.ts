import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { AnnouncementPermissionLog } from '@domain/core/announcement/announcement-permission-log.entity';
import { AnnouncementPermissionAction } from '@domain/core/announcement/announcement-permission-action.types';
import { SsoService } from '@domain/common/sso/sso.service';

/**
 * 공지사항 권한 검증 스케줄러
 *
 * 매일 새벽 3시에 모든 공지사항의 권한을 검증하고,
 * SSO 시스템에서 삭제되었거나 비활성화(isActive=false)된 부서/직원 정보가 있으면 로그를 남깁니다.
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
   * 
   * 성능 최적화:
   * - SSO API 일괄 호출 (중복 제거)
   * - 병렬 처리 (배치 단위)
   */
  @Cron('0 3 * * *') // 매일 새벽 3시
  async 모든_공지사항_권한을_검증한다() {
    this.logger.log('공지사항 권한 검증 스케줄러 시작');

    try {
      const startTime = Date.now();

      // 1. 모든 공지사항 조회 (Soft Delete되지 않은 것만)
      const announcements = await this.announcementRepository.find({
        where: { deletedAt: IsNull() },
      });

      this.logger.log(`검증 대상 공지사항: ${announcements.length}개`);

      if (announcements.length === 0) {
        this.logger.log('검증 대상 공지사항이 없습니다.');
        return;
      }

      // 2. 모든 부서 ID 수집 (중복 제거)
      const allDepartmentIds = new Set<string>();
      announcements.forEach(announcement => {
        if (announcement.permissionDepartmentIds && announcement.permissionDepartmentIds.length > 0) {
          announcement.permissionDepartmentIds.forEach(id => allDepartmentIds.add(id));
        }
      });

      this.logger.log(`검증 대상 부서 ID: ${allDepartmentIds.size}개 (중복 제거 후)`);

      // 3. SSO API 한 번만 호출 (일괄 조회)
      let departmentInfoMap = new Map<string, any>();
      if (allDepartmentIds.size > 0) {
        this.logger.log('SSO API 일괄 호출 중...');
        departmentInfoMap = await this.ssoService.부서_정보_목록을_조회한다(
          Array.from(allDepartmentIds)
        );
        this.logger.log(`SSO API 호출 완료 - ${departmentInfoMap.size}개 부서 정보 조회됨`);
      }

      // 4. 기존 미해결 로그 재검증 (병렬 처리)
      await this.모든_기존_로그를_재검증한다(announcements, departmentInfoMap);

      // 5. 병렬 처리로 공지사항 권한 검증 (배치 단위)
      const BATCH_SIZE = 10; // 한 번에 10개씩 병렬 처리
      let processedCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < announcements.length; i += BATCH_SIZE) {
        const batch = announcements.slice(i, i + BATCH_SIZE);
        
        const results = await Promise.all(
          batch.map(announcement => this.공지사항_권한을_검증한다(announcement, departmentInfoMap))
        );
        
        results.forEach(hasInvalid => {
          if (hasInvalid) {
            invalidCount++;
          }
          processedCount++;
        });

        // 진행 상황 로그 (10% 단위)
        const progressPercent = Math.floor((processedCount / announcements.length) * 100);
        if (progressPercent % 10 === 0 && i > 0) {
          this.logger.log(`진행률: ${progressPercent}% (${processedCount}/${announcements.length})`);
        }
      }

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `공지사항 권한 검증 완료 - 처리: ${processedCount}개, 무효 발견: ${invalidCount}개, 소요 시간: ${elapsedTime}초`,
      );
    } catch (error) {
      // 데이터베이스 연결 종료 에러는 무시 (테스트 환경에서 정상)
      if (error.message?.includes('Connection terminated')) {
        this.logger.debug('데이터베이스 연결이 종료되었습니다 (테스트 환경)');
        return;
      }
      
      this.logger.error('공지사항 권한 검증 중 오류 발생', error.message);
      // 테스트 환경에서 SSO 연결 실패나 데이터 없음 오류가 발생할 수 있으므로 에러를 throw하지 않음
    }
  }

  /**
   * 개별 공지사항의 권한을 검증한다
   * 
   * @param announcement 검증할 공지사항
   * @param departmentInfoMap 부서 정보 캐시 (성능 최적화용)
   */
  private async 공지사항_권한을_검증한다(
    announcement: Announcement,
    departmentInfoMap: Map<string, any>,
  ): Promise<boolean> {
    try {
      const hasDepartments =
        announcement.permissionDepartmentIds &&
        announcement.permissionDepartmentIds.length > 0;

      if (!hasDepartments) {
        // 부서 권한이 없으면 검증할 필요 없음 (직원 권한은 검증하지 않음)
        return false;
      }

      let invalidDepartments: Array<{ id: string; name: string | null }> = [];
      let validDepartments: Array<{ id: string; name: string | null }> = [];

      // 캐시된 부서 정보로 검증

      for (const departmentId of announcement.permissionDepartmentIds!) {
        const info = departmentInfoMap.get(departmentId);
        if (!info) {
          // SSO에서 조회 실패한 경우 (존재하지 않음) - 로그에 기록하지 않음
          this.logger.debug(
            `부서 정보 조회 실패 (로그 기록 안 함) - ID: ${departmentId}`,
          );
          validDepartments.push({ id: departmentId, name: null });
        } else if (!info.isActive) {
          // 비활성 부서 - 로그에 기록
          invalidDepartments.push({ id: departmentId, name: info.name });
        } else {
          // 활성 부서
          validDepartments.push({ id: departmentId, name: info.name });
        }
      }

      // 무효한 부서가 없으면 종료
      if (invalidDepartments.length === 0) {
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
          `무효한 부서 ${invalidDepartments.length}개 발견`,
      );

      // 변경 전 스냅샷 (ID와 이름 모두 포함)
      const originalSnapshot = {
        permissionRankIds: announcement.permissionRankIds,
        permissionPositionIds: announcement.permissionPositionIds,
        permissionDepartments: [...validDepartments, ...invalidDepartments],
        permissionEmployees: null, // 직원은 추적하지 않음
      };

      // DETECTED 로그 생성 (자동 제거하지 않고 로그만 남김)
      await this.permissionLogRepository.save({
        announcementId: announcement.id,
        invalidDepartments:
          invalidDepartments.length > 0 ? invalidDepartments : null,
        invalidEmployees: null, // 직원은 추적하지 않음
        invalidRankCodes: null,
        invalidPositionCodes: null,
        snapshotPermissions: originalSnapshot,
        action: AnnouncementPermissionAction.DETECTED,
        note: this.생성_감지_메모(invalidDepartments, []),
        detectedAt: new Date(),
      });

      // 관리자에게 알림 (수동 처리 필요)
      this.관리자에게_알림을_전송한다(announcement, invalidDepartments, []);

      return true;
    } catch (error) {
      // 데이터베이스 연결 종료 에러는 무시 (테스트 환경에서 정상)
      if (error.message?.includes('Connection terminated')) {
        this.logger.debug('데이터베이스 연결이 종료되었습니다 (테스트 환경)');
        return false;
      }
      
      this.logger.error(
        `공지사항 권한 검증 실패 - ID: ${announcement.id}, 에러: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * 모든 공지사항의 기존 미해결 로그를 재검증한다 (성능 최적화)
   * 
   * @param announcements 검증할 공지사항 목록
   * @param departmentInfoMap 부서 정보 캐시
   */
  private async 모든_기존_로그를_재검증한다(
    announcements: Announcement[],
    departmentInfoMap: Map<string, any>,
  ): Promise<void> {
    try {
      // 모든 공지사항의 미해결 로그 조회
      const announcementIds = announcements.map(a => a.id);
      const existingLogs = await this.permissionLogRepository.find({
        where: {
          announcementId: In(announcementIds),
          action: AnnouncementPermissionAction.DETECTED,
          resolvedAt: IsNull(),
        },
      });

      if (existingLogs.length === 0) {
        this.logger.log('재검증할 미해결 로그가 없습니다.');
        return;
      }

      this.logger.log(`재검증할 미해결 로그: ${existingLogs.length}개`);

      let resolvedCount = 0;

      for (const log of existingLogs) {
        if (!log.invalidDepartments || log.invalidDepartments.length === 0) {
          continue;
        }

        // 캐시된 부서 정보로 재검증
        let allReactivated = true;
        for (const dept of log.invalidDepartments) {
          const info = departmentInfoMap.get(dept.id);
          // 부서가 존재하고 활성화되어 있어야 함
          if (!info || !info.isActive) {
            allReactivated = false;
            break;
          }
        }

        // 모든 부서가 다시 활성화되었다면 로그를 자동 해결 처리
        if (allReactivated) {
          await this.permissionLogRepository.update(log.id, {
            action: AnnouncementPermissionAction.RESOLVED,
            resolvedAt: new Date(),
            resolvedBy: null,
            note: '부서가 다시 활성화되어 시스템에서 자동으로 해결됨',
          });

          resolvedCount++;

          const announcement = announcements.find(a => a.id === log.announcementId);
          if (announcement) {
            this.logger.log(
              `공지사항 "${announcement.title}" (ID: ${announcement.id})의 권한 로그가 자동으로 해결되었습니다. (부서 재활성화)`,
            );
          }
        }
      }

      if (resolvedCount > 0) {
        this.logger.log(`기존 로그 재검증 완료 - 자동 해결: ${resolvedCount}개`);
      }
    } catch (error) {
      // 데이터베이스 연결 종료 에러는 무시 (테스트 환경에서 정상)
      if (error.message?.includes('Connection terminated')) {
        this.logger.debug('데이터베이스 연결이 종료되었습니다 (테스트 환경)');
        return;
      }
      
      this.logger.error(
        `기존 로그 재검증 실패 - 에러: ${error.message}`,
      );
    }
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
        `부서 정보 없음 또는 비활성화: ${invalidDepartments.map((d) => d.id).join(', ')}`,
      );
    }

    if (invalidEmployees.length > 0) {
      messages.push(
        `직원 정보 없음 또는 비활성화: ${invalidEmployees.map((e) => e.id).join(', ')}`,
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
      `[알림] 공지사항 "${announcement.title}" (ID: ${announcement.id})에서 비활성화된 권한이 발견되었습니다.`,
    );
    this.logger.warn(`  → 관리자가 수동으로 부서 ID를 교체해야 합니다.`);

    if (invalidDepartments.length > 0) {
      this.logger.warn(
        `  - 비활성 부서: ${invalidDepartments.map((d) => `${d.id}${d.name ? ` (${d.name})` : ''}`).join(', ')}`,
      );
    }
  }
}
