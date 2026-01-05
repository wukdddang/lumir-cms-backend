import { Injectable, Logger } from '@nestjs/common';
import {
  ChangePasswordResult,
  CheckPasswordResult,
  DepartmentHierarchy,
  DepartmentInfo,
  EmployeeInfo,
  FCMTokenInfo,
  GetDepartmentHierarchyParams,
  GetEmployeeParams,
  GetEmployeesManagersResponse,
  GetEmployeesParams,
  GetFCMTokenParams,
  GetMultipleFCMTokensParams,
  LoginResult,
  MultipleFCMTokensInfo,
  RefreshTokenResult,
  SubscribeFCMParams,
  SubscribeFCMResult,
  UnsubscribeFCMParams,
  UnsubscribeFCMResult,
  VerifyTokenResult,
  ISSOService,
} from './interfaces';
import { JsonStorageUtil } from './utils/json-storage.util';

/**
 * Mock SSO 서비스
 * 테스트 환경에서 사용하며, 저장된 JSON 파일에서 응답을 반환한다
 */
@Injectable()
export class MockSSOService implements ISSOService {
  private readonly logger = new Logger(MockSSOService.name);

  /**
   * 시스템 인증을 수행한다 (Mock에서는 항상 성공)
   */
  async 초기화한다(): Promise<void> {
    this.logger.log('Mock SSO 서비스 초기화 완료 (JSON 파일에서 데이터 로드)');
  }

  /**
   * 저장된 JSON 파일에서 데이터를 로드한다
   */
  private 로드한다<T>(
    methodName: string,
    params?: Record<string, any>,
  ): T | null {
    const data = JsonStorageUtil.loadResponse(methodName, params);
    if (data === null) {
      this.logger.warn(
        `저장된 응답 데이터 없음: ${methodName}, 파라미터: ${JSON.stringify(params)}`,
      );
      return null;
    }
    return data as T;
  }

  // ========== 인증 관련 메서드 ==========

  /**
   * 사용자 로그인을 수행한다
   */
  async 로그인한다(email: string, password: string): Promise<LoginResult> {
    const result = this.로드한다<LoginResult>('로그인한다', { email });
    if (!result) {
      throw new Error(
        `로그인 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 로그인하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(`Mock 로그인: ${email}`);
    return result;
  }

  /**
   * 액세스 토큰을 검증한다
   */
  async 토큰을검증한다(accessToken: string): Promise<VerifyTokenResult> {
    const result = this.로드한다<VerifyTokenResult>('토큰을검증한다', {
      accessToken: '***',
    });
    if (!result) {
      throw new Error(
        `토큰 검증 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 토큰을 검증하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug('Mock 토큰 검증');
    return result;
  }

  /**
   * 리프레시 토큰으로 액세스 토큰을 갱신한다
   */
  async 토큰을갱신한다(refreshToken: string): Promise<RefreshTokenResult> {
    const result = this.로드한다<RefreshTokenResult>('토큰을갱신한다', {
      refreshToken: '***',
    });
    if (!result) {
      throw new Error(
        `토큰 갱신 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 토큰을 갱신하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug('Mock 토큰 갱신');
    return result;
  }

  /**
   * 현재 비밀번호를 확인한다
   */
  async 비밀번호를확인한다(
    accessToken: string,
    password: string,
    email: string,
  ): Promise<CheckPasswordResult> {
    const result = this.로드한다<CheckPasswordResult>('비밀번호를확인한다', {
      accessToken: '***',
      email,
    });
    if (!result) {
      throw new Error(
        `비밀번호 확인 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 비밀번호를 확인하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(`Mock 비밀번호 확인: ${email}`);
    return result;
  }

  /**
   * 비밀번호를 변경한다
   */
  async 비밀번호를변경한다(
    accessToken: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    const result = this.로드한다<ChangePasswordResult>('비밀번호를변경한다', {
      accessToken: '***',
    });
    if (!result) {
      throw new Error(
        `비밀번호 변경 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 비밀번호를 변경하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug('Mock 비밀번호 변경');
    return result;
  }

  // ========== 조직 정보 조회 메서드 ==========

  /**
   * 직원 정보를 조회한다
   */
  async 직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo> {
    const result = this.로드한다<EmployeeInfo>('직원정보를조회한다', params);
    if (!result) {
      throw new Error(
        `직원 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 직원 정보를 조회하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(
      `Mock 직원 정보 조회: ${params.employeeNumber || params.employeeId}`,
    );
    return result;
  }

  /**
   * 여러 직원의 정보를 조회한다
   */
  async 여러직원정보를조회한다(
    params: GetEmployeesParams,
  ): Promise<EmployeeInfo[]> {
    const result = this.로드한다<EmployeeInfo[]>(
      '여러직원정보를조회한다',
      params,
    );
    if (!result) {
      throw new Error(
        `여러 직원 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 여러 직원 정보를 조회하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(
      `Mock 여러 직원 정보 조회: ${params.identifiers?.length || 0}명`,
    );
    return result;
  }

  /**
   * 여러 직원의 원시 정보를 조회한다 (동기화용)
   * EmployeeInfo로 변환하지 않고 SSO 원시 데이터를 그대로 반환
   */
  async 여러직원원시정보를조회한다(params: GetEmployeesParams): Promise<any[]> {
    // 먼저 원시 데이터를 로드 시도
    const rawResult = this.로드한다<any[]>(
      '여러직원원시정보를조회한다',
      params,
    );
    if (rawResult) {
      this.logger.debug(`Mock 여러 직원 원시 정보 조회: ${rawResult.length}명`);
      return rawResult;
    }

    // 원시 데이터가 없으면 변환된 데이터를 로드 시도
    const convertedResult = this.로드한다<EmployeeInfo[]>(
      '여러직원정보를조회한다',
      params,
    );
    if (!convertedResult) {
      throw new Error(
        `여러 직원 원시 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 여러 직원 정보를 조회하여 JSON 파일을 생성하세요.`,
      );
    }

    this.logger.debug(
      `Mock 여러 직원 원시 정보 조회 (변환된 데이터 사용): ${convertedResult.length}명`,
    );
    // 변환된 데이터를 원시 데이터 형태로 변환 (간단한 변환)
    return convertedResult as any[];
  }

  /**
   * 부서 계층구조를 조회한다
   */
  async 부서계층구조를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentHierarchy> {
    const result = this.로드한다<DepartmentHierarchy>(
      '부서계층구조를조회한다',
      params || {},
    );
    if (!result) {
      throw new Error(
        `부서 계층구조 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 부서 계층구조를 조회하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(
      `Mock 부서 계층구조 조회: ${result.totalDepartments}개 부서`,
    );
    return result;
  }

  /**
   * 전체 직원의 관리자 정보를 조회한다
   */
  async 직원관리자정보를조회한다(): Promise<GetEmployeesManagersResponse> {
    const result = this.로드한다<GetEmployeesManagersResponse>(
      '직원관리자정보를조회한다',
      {},
    );
    if (!result) {
      throw new Error(
        `직원 관리자 정보 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 직원 관리자 정보를 조회하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(`Mock 직원 관리자 정보 조회: ${result.total}명`);
    return result;
  }

  // ========== FCM 토큰 관리 메서드 ==========

  /**
   * FCM 토큰을 구독한다 (앱 로그인 시)
   */
  async FCM토큰을구독한다(
    params: SubscribeFCMParams,
  ): Promise<SubscribeFCMResult> {
    const result = this.로드한다<SubscribeFCMResult>(
      'FCM토큰을구독한다',
      params,
    );
    if (!result) {
      throw new Error(
        `FCM 토큰 구독 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 FCM 토큰을 구독하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(`Mock FCM 토큰 구독: ${params.employeeNumber}`);
    return result;
  }

  /**
   * FCM 토큰 구독을 해지한다 (앱 로그아웃 시)
   */
  async FCM토큰을구독해지한다(
    params: UnsubscribeFCMParams,
  ): Promise<UnsubscribeFCMResult> {
    const result = this.로드한다<UnsubscribeFCMResult>(
      'FCM토큰을구독해지한다',
      params,
    );
    if (!result) {
      throw new Error(
        `FCM 토큰 구독 해지 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 FCM 토큰 구독을 해지하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(`Mock FCM 토큰 구독 해지: ${params.employeeNumber}`);
    return result;
  }

  /**
   * FCM 토큰을 조회한다
   */
  async FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo> {
    const result = this.로드한다<FCMTokenInfo>('FCM토큰을조회한다', params);
    if (!result) {
      throw new Error(
        `FCM 토큰 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 FCM 토큰을 조회하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(`Mock FCM 토큰 조회: ${params.employeeNumber}`);
    return result;
  }

  /**
   * 여러 직원의 FCM 토큰을 조회한다 (알림 서버용)
   */
  async 여러직원의FCM토큰을조회한다(
    params: GetMultipleFCMTokensParams,
  ): Promise<MultipleFCMTokensInfo> {
    const result = this.로드한다<MultipleFCMTokensInfo>(
      '여러직원의FCM토큰을조회한다',
      params,
    );
    if (!result) {
      throw new Error(
        `여러 직원의 FCM 토큰 조회 응답 데이터가 없습니다. 먼저 실제 SSO 서비스로 여러 직원의 FCM 토큰을 조회하여 JSON 파일을 생성하세요.`,
      );
    }
    this.logger.debug(
      `Mock 여러 직원의 FCM 토큰 조회: ${params.employeeNumbers.length}명`,
    );
    return result;
  }

  // ========== 편의 메서드 ==========

  /**
   * 사번으로 직원 정보를 조회한다 (상세 정보 포함)
   */
  async 사번으로직원을조회한다(employeeNumber: string): Promise<EmployeeInfo> {
    return this.직원정보를조회한다({
      employeeNumber,
      withDetail: true,
    });
  }

  /**
   * 이메일로 직원 정보를 조회한다
   * 전체 직원 목록을 가져온 후 이메일로 필터링
   */
  async 이메일로직원을조회한다(email: string): Promise<EmployeeInfo | null> {
    const employees = await this.여러직원정보를조회한다({
      withDetail: true,
    });
    return employees.find((emp) => emp.email === email) || null;
  }

  /**
   * SSO에서 모든 부서 정보를 평면 목록으로 조회한다
   */
  async 모든부서정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentInfo[]> {
    const result = this.로드한다<DepartmentInfo[]>(
      '모든부서정보를조회한다',
      params || {},
    );
    if (!result) {
      // 부서 계층구조를 조회해서 변환 시도
      const hierarchy = await this.부서계층구조를조회한다({
        ...params,
        includeEmptyDepartments: true,
        withEmployeeDetail: false,
      });

      const departments: DepartmentInfo[] = [];

      const flattenDepartments = (nodes: any[]): void => {
        for (const node of nodes) {
          departments.push({
            id: node.id,
            departmentCode: node.departmentCode,
            departmentName: node.departmentName,
            parentDepartmentId: node.parentDepartmentId,
          });

          if (node.children && node.children.length > 0) {
            flattenDepartments(node.children);
          }
        }
      };

      flattenDepartments(hierarchy.departments);
      return departments;
    }
    this.logger.debug(`Mock 모든 부서 정보 조회: ${result.length}개`);
    return result;
  }

  /**
   * SSO에서 모든 직원 정보를 평면 목록으로 조회한다
   */
  async 모든직원정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<EmployeeInfo[]> {
    const result = this.로드한다<EmployeeInfo[]>(
      '모든직원정보를조회한다',
      params || {},
    );
    if (!result) {
      // 부서 계층구조를 조회해서 변환 시도
      const hierarchy = await this.부서계층구조를조회한다({
        ...params,
        includeEmptyDepartments: true,
        withEmployeeDetail: true,
      });

      const employees: EmployeeInfo[] = [];

      const flattenEmployees = (nodes: any[]): void => {
        for (const node of nodes) {
          if (node.employees && node.employees.length > 0) {
            employees.push(...node.employees);
          }

          if (node.children && node.children.length > 0) {
            flattenEmployees(node.children);
          }
        }
      };

      flattenEmployees(hierarchy.departments);
      return employees;
    }
    this.logger.debug(`Mock 모든 직원 정보 조회: ${result.length}명`);
    return result;
  }
}
