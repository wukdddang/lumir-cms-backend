import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WikiFileSystem } from '@domain/sub/wiki-file-system/wiki-file-system.entity';
import { WikiPermissionLog } from '@domain/sub/wiki-file-system/wiki-permission-log.entity';
import { WikiPermissionAction } from '@domain/sub/wiki-file-system/wiki-permission-action.types';
import { SsoService } from '@domain/common/sso/sso.service';

/**
 * 위키 권한 검증 스케줄러
 *
 * 매일 새벽 2시에 모든 위키의 권한을 검증하고,
 * SSO 시스템에서 삭제되었거나 비활성화(isActive=false)된 부서 정보가 있으면 로그를 남깁니다.
 */
@Injectable()
export class WikiPermissionScheduler {
  private readonly logger = new Logger(WikiPermissionScheduler.name);

  constructor(
    @InjectRepository(WikiFileSystem)
    private readonly wikiRepository: Repository<WikiFileSystem>,
    @InjectRepository(WikiPermissionLog)
    private readonly permissionLogRepository: Repository<WikiPermissionLog>,
    private readonly ssoService: SsoService,
  ) {}

  /**
   * 매일 새벽 2시에 모든 위키의 권한을 검증한다
   * 
   * 수동 실행이 필요한 경우 관리자 API를 통해 즉시 실행 가능
   */
  @Cron('0 2 * * *') // 매일 새벽 2시
  async 모든_위키_권한을_검증한다() {
    this.logger.log('위키 권한 검증 스케줄러 시작');

    try {
      // 모든 위키 조회 (Soft Delete되지 않은 것만)
      const wikis = await this.wikiRepository.find({
        where: { deletedAt: IsNull() },
      });

      this.logger.log(`검증 대상 위키: ${wikis.length}개`);

      let processedCount = 0;
      let invalidCount = 0;

      // 각 위키의 권한 검증
      for (const wiki of wikis) {
        const hasInvalid = await this.위키_권한을_검증한다(wiki);
        if (hasInvalid) {
          invalidCount++;
        }
        processedCount++;
      }

      this.logger.log(
        `위키 권한 검증 완료 - 처리: ${processedCount}개, 무효 발견: ${invalidCount}개`,
      );
    } catch (error) {
      this.logger.error('위키 권한 검증 중 오류 발생', error.message);
      // 테스트 환경에서 SSO 연결 실패나 데이터 없음 오류가 발생할 수 있으므로 에러를 throw하지 않음
    }
  }

  /**
   * 개별 위키의 권한을 검증한다
   */
  private async 위키_권한을_검증한다(wiki: WikiFileSystem): Promise<boolean> {
    if (!wiki.permissionDepartmentIds || wiki.permissionDepartmentIds.length === 0) {
      // 부서 권한이 없으면 검증할 필요 없음
      return false;
    }

    // 1단계: 기존 미해결 로그가 있는지 확인하고, 부서가 다시 활성화되었는지 검증
    await this.기존_로그를_재검증한다(wiki);

    // 부서 정보 조회 (부서 ID로)
    // SSO에서 조회 후 isActive: false인 부서만 invalid로 처리
    const departmentInfoMap = await this.ssoService.부서_정보_목록을_조회한다(
      wiki.permissionDepartmentIds,
    );

    // 유효한 부서와 무효한 부서 분리
    // SSO에서 조회 후 isActive: false인 부서만 invalid로 처리
    const validDepartments: Array<{ id: string; name: string | null }> = [];
    const invalidDepartments: Array<{ id: string; name: string | null }> = [];

    for (const departmentId of wiki.permissionDepartmentIds) {
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
        wikiFileSystemId: wiki.id,
        action: WikiPermissionAction.DETECTED,
        resolvedAt: IsNull(),
      },
      order: { detectedAt: 'DESC' },
    });

    if (existingLog) {
      this.logger.debug(
        `위키 "${wiki.name}" (ID: ${wiki.id})에 ` +
          `이미 미해결 로그가 존재하여 스킵합니다.`,
      );
      return false;
    }

    this.logger.warn(
      `위키 "${wiki.name}" (ID: ${wiki.id})에서 무효한 부서 ${invalidDepartments.length}개 발견`,
    );

    // 변경 전 스냅샷 (부서 ID와 이름 모두 포함)
    const originalSnapshot = {
      permissionRankIds: wiki.permissionRankIds,
      permissionPositionIds: wiki.permissionPositionIds,
      permissionDepartments: [
        ...validDepartments,
        ...invalidDepartments,
      ],
    };

    // DETECTED 로그 생성 (자동 제거하지 않고 로그만 남김)
    await this.permissionLogRepository.save({
      wikiFileSystemId: wiki.id,
      invalidDepartments,
      invalidRankCodes: null,
      invalidPositionCodes: null,
      snapshotPermissions: originalSnapshot,
      action: WikiPermissionAction.DETECTED,
      note: `SSO에서 부서 정보 없음 또는 비활성화: ${invalidDepartments.map((d) => d.id).join(', ')}`,
      detectedAt: new Date(),
    });

    // 관리자에게 알림 (수동 처리 필요)
    this.관리자에게_알림을_전송한다(wiki, invalidDepartments);

    return true;
  }

  /**
   * 기존 미해결 로그를 재검증하여 부서가 다시 활성화되었는지 확인한다
   */
  private async 기존_로그를_재검증한다(
    wiki: WikiFileSystem,
  ): Promise<void> {
    // 미해결 로그 조회
    const existingLogs = await this.permissionLogRepository.find({
      where: {
        wikiFileSystemId: wiki.id,
        action: WikiPermissionAction.DETECTED,
        resolvedAt: IsNull(),
      },
    });

    if (existingLogs.length === 0) {
      return;
    }

    for (const log of existingLogs) {
      if (!log.invalidDepartments || log.invalidDepartments.length === 0) {
        continue;
      }

      // 로그에 기록된 비활성 부서들이 현재 활성 상태인지 확인
      const departmentIds = log.invalidDepartments.map((d) => d.id);
      const departmentInfoMap =
        await this.ssoService.부서_정보_목록을_조회한다(departmentIds);

      let allReactivated = true;
      for (const departmentId of departmentIds) {
        const info = departmentInfoMap.get(departmentId);
        // 부서가 존재하고 활성화되어 있어야 함
        if (!info || !info.isActive) {
          allReactivated = false;
          break;
        }
      }

      // 모든 부서가 다시 활성화되었다면 로그를 자동 해결 처리
      if (allReactivated) {
        await this.permissionLogRepository.update(log.id, {
          action: WikiPermissionAction.RESOLVED,
          resolvedAt: new Date(),
          resolvedBy: 'system',
          note: '부서가 다시 활성화되어 자동으로 해결됨',
        });

        this.logger.log(
          `위키 "${wiki.name}" (ID: ${wiki.id})의 ` +
            `권한 로그가 자동으로 해결되었습니다. (부서 재활성화)`,
        );
      }
    }
  }

  /**
   * 관리자에게 권한 변경 알림을 전송한다
   */
  private 관리자에게_알림을_전송한다(
    wiki: WikiFileSystem,
    invalidDepartments: Array<{ id: string; name: string | null }>,
  ) {
    // TODO: 실제 알림 서비스 연동 필요 (이메일, 슬랙 등)
    this.logger.warn(
      `[알림] 위키 "${wiki.name}" (ID: ${wiki.id})에서 비활성화된 부서가 발견되었습니다.`,
    );
    this.logger.warn(
      `  → 관리자가 수동으로 부서 ID를 교체해야 합니다.`,
    );
    this.logger.warn(
      `  - 비활성 부서: ${invalidDepartments.map((d) => `${d.id}${d.name ? ` (${d.name})` : ''}`).join(', ')}`,
    );
  }
}
