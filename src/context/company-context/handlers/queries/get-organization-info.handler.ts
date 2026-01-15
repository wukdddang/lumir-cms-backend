import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  OrganizationInfo,
  Department,
} from '../../interfaces/company-context.interface';

/**
 * 조직 정보 조회 쿼리
 */
export class GetOrganizationInfoQuery {
  constructor() {}
}

/**
 * 조직 정보 조회 핸들러
 *
 * SSO 서버로부터 전체 조직 구조를 가져오고, isActive가 true인 부서만 필터링합니다.
 */
@Injectable()
@QueryHandler(GetOrganizationInfoQuery)
export class GetOrganizationInfoHandler implements IQueryHandler<GetOrganizationInfoQuery> {
  private readonly logger = new Logger(GetOrganizationInfoHandler.name);
  private readonly ssoBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>('SSO_BASE_URL') || '';
    // trailing slash 제거
    this.ssoBaseUrl = baseUrl.replace(/\/$/, '');

    if (!this.ssoBaseUrl) {
      this.logger.warn('SSO_BASE_URL이 설정되지 않았습니다.');
    }
  }

  /**
   * 부서를 재귀적으로 필터링 (isActive가 true인 것만)
   */
  private filterActiveDepartments(department: Department): Department | null {
    // 현재 부서가 비활성이면 null 반환
    if (!department.isActive) {
      this.logger.debug(
        `비활성 부서 제외: ${department.departmentName} (${department.id})`,
      );
      return null;
    }

    // 자식 부서가 있으면 재귀적으로 필터링
    if (department.childDepartments && department.childDepartments.length > 0) {
      const originalCount = department.childDepartments.length;
      const activeChildren = department.childDepartments
        .map((child) => this.filterActiveDepartments(child))
        .filter((child): child is Department => child !== null);

      if (originalCount !== activeChildren.length) {
        this.logger.debug(
          `부서 "${department.departmentName}" 자식 필터링: ${originalCount}개 → ${activeChildren.length}개`,
        );
      }

      return {
        ...department,
        childDepartments: activeChildren,
      };
    }

    return department;
  }

  async execute(query: GetOrganizationInfoQuery): Promise<OrganizationInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ssoBaseUrl}/api/admin/organizations`),
      );

      const orgInfo = response.data as OrganizationInfo;

      // isActive가 true인 부서만 필터링
      const activeDepartments = orgInfo.departments
        .map((dept) => this.filterActiveDepartments(dept))
        .filter((dept): dept is Department => dept !== null);

      const filteredOrgInfo: OrganizationInfo = {
        departments: activeDepartments,
      };

      return filteredOrgInfo;
    } catch (error) {
      this.logger.error('조직 정보 조회 실패', error);
      throw new Error('조직 정보를 가져오는데 실패했습니다.');
    }
  }
}
