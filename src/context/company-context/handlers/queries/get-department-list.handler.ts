import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DepartmentListResult } from '../../interfaces/company-context.interface';

/**
 * 부서 목록 조회 쿼리
 */
export class GetDepartmentListQuery {
  constructor() {}
}

/**
 * 부서 목록 조회 핸들러
 *
 * SSO 서버로부터 부서 목록을 가져오고, isActive가 true인 부서만 필터링합니다.
 */
@Injectable()
@QueryHandler(GetDepartmentListQuery)
export class GetDepartmentListHandler implements IQueryHandler<GetDepartmentListQuery> {
  private readonly logger = new Logger(GetDepartmentListHandler.name);
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

  async execute(query: GetDepartmentListQuery): Promise<DepartmentListResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.ssoBaseUrl}/api/admin/organizations/departments`,
        ),
      );

      const deptList = response.data as DepartmentListResult;

      // isActive가 true인 부서만 필터링
      const activeDepartments = deptList.departments.filter(
        (dept) => dept.isActive,
      );

      const filteredDeptList: DepartmentListResult = {
        departments: activeDepartments,
      };

      return filteredDeptList;
    } catch (error) {
      this.logger.error('부서 목록 조회 실패', error);
      throw new Error('부서 목록을 가져오는데 실패했습니다.');
    }
  }
}
