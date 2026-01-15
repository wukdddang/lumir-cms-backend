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
 * SSO 시스템에서 삭제된 부서 정보가 있으면 로그를 남깁니다.
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
      this.logger.error('위키 권한 검증 중 오류 발생', error);
      throw error;
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

    // 부서 정보 조회 (부서 ID로)
    const departmentInfoMap = await this.ssoService.부서_정보_목록을_조회한다(
      wiki.permissionDepartmentIds,
    );

    // 유효한 부서와 무효한 부서 분리
    const validDepartments: Array<{ id: string; name: string | null }> = [];
    const invalidDepartments: Array<{ id: string; name: string | null }> = [];

    for (const departmentId of wiki.permissionDepartmentIds) {
      const info = departmentInfoMap.get(departmentId);
      if (info) {
        validDepartments.push({ id: departmentId, name: info.name });
      } else {
        invalidDepartments.push({ id: departmentId, name: null });
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

    // DETECTED 로그 생성
    await this.permissionLogRepository.save({
      wikiFileSystemId: wiki.id,
      invalidDepartments,
      invalidRankCodes: null,
      invalidPositionCodes: null,
      snapshotPermissions: originalSnapshot,
      action: WikiPermissionAction.DETECTED,
      note: `SSO에서 부서 정보 없음: ${invalidDepartments.map((d) => d.id).join(', ')}`,
      detectedAt: new Date(),
    });

    // 위키에서 무효한 부서 제거
    wiki.permissionDepartmentIds = validDepartments.map((d) => d.id);
    await this.wikiRepository.save(wiki);

    // REMOVED 로그 생성
    await this.permissionLogRepository.save({
      wikiFileSystemId: wiki.id,
      invalidDepartments,
      invalidRankCodes: null,
      invalidPositionCodes: null,
      snapshotPermissions: originalSnapshot,
      action: WikiPermissionAction.REMOVED,
      note: '무효한 부서 코드 자동 제거 완료',
      detectedAt: new Date(),
    });

    // 관리자에게 알림
    this.관리자에게_알림을_전송한다(wiki, invalidDepartments);

    // NOTIFIED 로그 생성
    await this.permissionLogRepository.save({
      wikiFileSystemId: wiki.id,
      invalidDepartments,
      invalidRankCodes: null,
      invalidPositionCodes: null,
      snapshotPermissions: originalSnapshot,
      action: WikiPermissionAction.NOTIFIED,
      note: '관리자에게 알림 전송 완료',
      detectedAt: new Date(),
    });

    return true;
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
      `[알림] 위키 "${wiki.name}" (ID: ${wiki.id})의 부서 권한이 무효화되었습니다.`,
    );
    this.logger.warn(
      `  - 무효 부서: ${invalidDepartments.map((d) => `${d.id}${d.name ? ` (${d.name})` : ''}`).join(', ')}`,
    );
  }
}
