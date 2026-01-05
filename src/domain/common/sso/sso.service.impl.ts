import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChangePasswordResult,
  CheckPasswordResult,
  DepartmentHierarchy,
  DepartmentInfo,
  DepartmentNode,
  EmployeeInfo,
  EmployeeStatus,
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
 * SSO 서비스 구현체
 * SSO SDK를 직접 사용하여 비즈니스 로직에서 사용하기 쉽게 한다
 * 실제 외부 연동을 수행하고 응답을 JSON 파일로 저장한다
 */
@Injectable()
export class SSOServiceImpl implements ISSOService, OnModuleInit {
  private readonly logger = new Logger(SSOServiceImpl.name);
  private readonly sdkClient: any; // SDK 클라이언트 타입
  private readonly systemName: string;
  private initialized = false;
  private readonly enableJsonStorage: boolean;

  constructor(
    @Inject('SSO_CONFIG') private readonly config: any,
    @Inject('SSO_SYSTEM_NAME') private readonly injectedSystemName: string,
    @Inject('SSO_ENABLE_JSON_STORAGE')
    private readonly injectedEnableJsonStorage?: boolean,
  ) {
    this.systemName = injectedSystemName;

    // 서버리스 환경 감지
    const isServerless =
      !!process.env.VERCEL ||
      !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
      !!process.env.GOOGLE_CLOUD_FUNCTION ||
      !!process.env.AZURE_FUNCTIONS_ENVIRONMENT;

    // 서버리스 환경이 아닐 때만 JSON 저장 활성화
    this.enableJsonStorage =
      !isServerless &&
      (injectedEnableJsonStorage ??
        process.env.SSO_ENABLE_JSON_STORAGE === 'true');

    // 설정값 로깅 (민감 정보 제외)
    this.logger.log(
      `SSO 클라이언트 초기화 중... baseUrl: ${this.config.baseUrl}, timeoutMs: ${this.config.timeoutMs}, retries: ${this.config.retries}, retryDelay: ${this.config.retryDelay}, JSON 저장: ${this.enableJsonStorage}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SSOClient: SDKSSOClientClass } = require('@lumir-company/sso-sdk');
    this.sdkClient = new SDKSSOClientClass({
      baseUrl: this.config.baseUrl,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      systemName: this.config.systemName || this.systemName,
      timeoutMs: this.config.timeoutMs,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      enableLogging: this.config.enableLogging,
    });

    this.logger.log('SSO 클라이언트 인스턴스 생성 완료');
  }

  async onModuleInit(): Promise<void> {
    await this.초기화한다();
  }

  /**
   * 시스템 인증을 수행한다
   */
  async 초기화한다(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.log(
        `SSO 클라이언트 초기화 시작... baseUrl: ${this.config.baseUrl}, systemName: ${this.systemName}`,
      );
      const startTime = Date.now();

      await this.sdkClient.initialize();

      const elapsedTime = Date.now() - startTime;
      this.initialized = true;
      this.logger.log(
        `SSO 클라이언트 초기화 완료 (소요 시간: ${elapsedTime}ms)`,
      );
    } catch (error) {
      this.logger.error(
        `SSO 클라이언트 초기화 실패: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `초기화 실패 상세: code=${error?.code}, status=${error?.status}, baseUrl=${this.config.baseUrl}`,
      );
      throw error;
    }
  }

  private 초기화확인(): void {
    if (!this.initialized) {
      throw new Error(
        'SSO 클라이언트가 초기화되지 않았습니다. 먼저 초기화한다()를 호출하세요.',
      );
    }
  }

  /**
   * 응답 데이터를 JSON 파일로 저장한다 (활성화된 경우)
   */
  private 저장한다(methodName: string, params: any, data: any): void {
    if (this.enableJsonStorage) {
      JsonStorageUtil.saveResponse(methodName, params, data);
    }
  }

  // ========== 인증 관련 메서드 ==========

  /**
   * 사용자 로그인을 수행한다
   * 아이디/비밀번호가 일치하면 역할과 관계없이 로그인을 허용한다
   */
  async 로그인한다(email: string, password: string): Promise<LoginResult> {
    this.초기화확인();
    let result: LoginResult;
    try {
      result = await this.sdkClient.sso.login(email, password);
      this.logger.log(`로그인 성공: ${email}`);
    } catch (error) {
      this.logger.error('로그인 실패', error);
      throw error;
    }
    this.logger.log(`로그인 결과: ${JSON.stringify(result)}`);
    // 시스템 역할 검증 제거: 아이디/비밀번호만 맞으면 로그인 허용
    // this.시스템역할을검증한다(result);

    // JSON 저장
    this.저장한다('로그인한다', { email }, result);

    return result;
  }

  /**
   * 시스템 역할을 검증한다
   * systemRoles에 설정된 시스템(기본: EMS-PROD)의 역할이 없거나 비어있으면 예외를 발생시킨다
   *
   * @param loginResult 로그인 결과
   * @throws {ForbiddenException} 시스템 역할이 없거나 비어있는 경우
   */
  private 시스템역할을검증한다(loginResult: LoginResult): void {
    const systemRoles = loginResult.systemRoles;

    // systemRoles가 없는 경우
    if (!systemRoles) {
      this.logger.warn(
        `사용자 ${loginResult.email}의 systemRoles가 존재하지 않습니다.`,
      );
      throw new ForbiddenException(
        `이 시스템(${this.systemName})에 대한 접근 권한이 없습니다.`,
      );
    }

    // 시스템별 역할 배열 가져오기
    const roles = systemRoles[this.systemName];

    // 시스템 역할이 없거나 빈 배열인 경우
    if (!roles || roles.length === 0) {
      this.logger.warn(
        `사용자 ${loginResult.email}에게 ${this.systemName} 시스템 역할이 없습니다. ` +
          `보유 시스템: ${Object.keys(systemRoles).join(', ')}`,
      );
      throw new ForbiddenException(
        `이 시스템(${this.systemName})에 대한 접근 권한이 없습니다. ` +
          `시스템 관리자에게 문의하세요.`,
      );
    }
  }

  /**
   * 액세스 토큰을 검증한다
   * 토큰이 유효하지 않으면 UnauthorizedException을 발생시킨다
   *
   * @throws {UnauthorizedException} 토큰이 유효하지 않은 경우
   */
  async 토큰을검증한다(accessToken: string): Promise<VerifyTokenResult> {
    this.초기화확인();
    const result = await this.sdkClient.sso.verifyToken(accessToken);

    // valid가 false인 경우 예외 발생
    if (!result.valid) {
      this.logger.warn('유효하지 않은 토큰 검증 시도');
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // JSON 저장
    this.저장한다('토큰을검증한다', { accessToken: '***' }, result);

    return result;
  }

  /**
   * 리프레시 토큰으로 액세스 토큰을 갱신한다
   */
  async 토큰을갱신한다(refreshToken: string): Promise<RefreshTokenResult> {
    this.초기화확인();
    const result = await this.sdkClient.sso.refreshToken(refreshToken);

    // JSON 저장
    this.저장한다('토큰을갱신한다', { refreshToken: '***' }, result);

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
    this.초기화확인();
    const result = await this.sdkClient.sso.checkPassword(
      accessToken,
      password,
      email,
    );

    // JSON 저장
    this.저장한다('비밀번호를확인한다', { accessToken: '***', email }, result);

    return result;
  }

  /**
   * 비밀번호를 변경한다
   */
  async 비밀번호를변경한다(
    accessToken: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    this.초기화확인();
    const result = await this.sdkClient.sso.changePassword(
      accessToken,
      newPassword,
    );

    // JSON 저장
    this.저장한다('비밀번호를변경한다', { accessToken: '***' }, result);

    return result;
  }

  // ========== 조직 정보 조회 메서드 ==========

  /**
   * 직원 정보를 조회한다
   */
  async 직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.organization.getEmployee({
        employeeNumber: params.employeeNumber,
        employeeId: params.employeeId,
        withDetail: params.withDetail,
      });

      const employeeInfo = this.mapToEmployeeInfo(result);

      // JSON 저장
      this.저장한다('직원정보를조회한다', params, employeeInfo);

      return employeeInfo;
    } catch (error) {
      this.logger.error('직원 정보 조회 실패', error);
      throw error;
    }
  }

  /**
   * 여러 직원의 정보를 조회한다
   */
  async 여러직원정보를조회한다(
    params: GetEmployeesParams,
  ): Promise<EmployeeInfo[]> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.organization.getEmployees({
        identifiers: params.identifiers,
        withDetail: params.withDetail,
        includeTerminated: params.includeTerminated,
      });

      // SDK 응답이 배열인지 확인
      const employees = Array.isArray(result)
        ? result
        : result?.employees || result?.data || [];

      if (!Array.isArray(employees)) {
        this.logger.warn(
          '예상치 못한 응답 형식:',
          JSON.stringify(result).substring(0, 200),
        );
        return [];
      }

      const employeeInfos = employees.map((emp) => this.mapToEmployeeInfo(emp));

      // JSON 저장
      this.저장한다('여러직원정보를조회한다', params, employeeInfos);

      return employeeInfos;
    } catch (error) {
      this.logger.error('여러 직원 정보 조회 실패', error);
      throw error;
    }
  }

  /**
   * 여러 직원의 원시 정보를 조회한다 (동기화용)
   * EmployeeInfo로 변환하지 않고 SSO 원시 데이터를 그대로 반환
   */
  async 여러직원원시정보를조회한다(params: GetEmployeesParams): Promise<any[]> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.organization.getEmployees({
        identifiers: params.identifiers,
        withDetail: params.withDetail,
        includeTerminated: params.includeTerminated,
      });

      // SDK 응답이 배열인지 확인
      const employees = Array.isArray(result)
        ? result
        : result?.employees || result?.data || [];

      if (!Array.isArray(employees)) {
        this.logger.warn(
          '예상치 못한 응답 형식:',
          JSON.stringify(result).substring(0, 200),
        );
        return [];
      }

      // 원시 데이터를 그대로 반환 (변환하지 않음)
      // JSON 저장
      this.저장한다('여러직원원시정보를조회한다', params, employees);

      return employees;
    } catch (error) {
      this.logger.error('여러 직원 원시 정보 조회 실패', error);
      throw error;
    }
  }

  /**
   * 부서 계층구조를 조회한다
   */
  async 부서계층구조를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentHierarchy> {
    this.초기화확인();
    try {
      this.logger.log(
        `부서 계층구조 조회 요청 시작... baseUrl: ${this.config.baseUrl}`,
      );
      const startTime = Date.now();

      const result = await this.sdkClient.organization.getDepartmentHierarchy({
        rootDepartmentId: params?.rootDepartmentId,
        maxDepth: params?.maxDepth,
        withEmployeeDetail: params?.withEmployeeDetail,
        includeEmptyDepartments: params?.includeEmptyDepartments,
      });

      const elapsedTime = Date.now() - startTime;
      this.logger.log(`부서 계층구조 조회 완료 (소요 시간: ${elapsedTime}ms)`);

      const hierarchy = {
        departments: result.departments.map((dept) =>
          this.mapToDepartmentNode(dept),
        ),
        totalDepartments: result.totalDepartments,
        totalEmployees: result.totalEmployees,
      };

      // JSON 저장
      this.저장한다('부서계층구조를조회한다', params || {}, hierarchy);

      return hierarchy;
    } catch (error) {
      // 타임아웃 에러인 경우 더 자세한 로그
      if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
        this.logger.error(
          `부서 계층구조 조회 타임아웃: ${error.message}. 현재 타임아웃 설정: ${this.config.timeoutMs}ms. SSO 서버 응답이 지연되고 있습니다.`,
        );
        this.logger.error(
          `타임아웃 상세 정보: baseUrl=${this.config.baseUrl}, 요청이 SSO 서버에 도달했는지 확인이 필요합니다.`,
        );
      } else {
        this.logger.error('부서 계층구조 조회 실패', error);
        this.logger.error(
          `에러 상세: code=${error?.code}, status=${error?.status}, message=${error?.message}, baseUrl=${this.config.baseUrl}`,
        );
      }
      throw error;
    }
  }

  // ========== FCM 토큰 관리 메서드 ==========

  /**
   * FCM 토큰을 구독한다 (앱 로그인 시)
   */
  async FCM토큰을구독한다(
    params: SubscribeFCMParams,
  ): Promise<SubscribeFCMResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.subscribe({
        employeeNumber: params.employeeNumber,
        fcmToken: params.fcmToken,
        deviceType: params.deviceType,
      });

      const subscribeResult = {
        success: true,
        fcmToken: result.fcmToken,
        employeeNumber: result.employeeNumber,
        deviceType: result.deviceType,
      };

      // JSON 저장
      this.저장한다('FCM토큰을구독한다', params, subscribeResult);

      return subscribeResult;
    } catch (error) {
      this.logger.error('FCM 토큰 구독 실패', error);
      throw error;
    }
  }

  /**
   * FCM 토큰 구독을 해지한다 (앱 로그아웃 시)
   */
  async FCM토큰을구독해지한다(
    params: UnsubscribeFCMParams,
  ): Promise<UnsubscribeFCMResult> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.unsubscribe({
        employeeNumber: params.employeeNumber,
      });

      const unsubscribeResult = {
        success: result.success || true,
        deletedCount: result.deletedCount || 0,
        message: result.message,
      };

      // JSON 저장
      this.저장한다('FCM토큰을구독해지한다', params, unsubscribeResult);

      return unsubscribeResult;
    } catch (error) {
      this.logger.error('FCM 토큰 구독 해지 실패', error);
      throw error;
    }
  }

  /**
   * FCM 토큰을 조회한다
   */
  async FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.getToken({
        employeeNumber: params.employeeNumber,
      });

      const tokenInfo = {
        employeeNumber: result.employeeNumber,
        tokens: result.tokens.map((token) => ({
          fcmToken: token.fcmToken,
          deviceType: token.deviceType,
          createdAt: new Date(token.createdAt),
        })),
      };

      // JSON 저장
      this.저장한다('FCM토큰을조회한다', params, tokenInfo);

      return tokenInfo;
    } catch (error) {
      this.logger.error('FCM 토큰 조회 실패', error);
      throw error;
    }
  }

  /**
   * 여러 직원의 FCM 토큰을 조회한다 (알림 서버용)
   */
  async 여러직원의FCM토큰을조회한다(
    params: GetMultipleFCMTokensParams,
  ): Promise<MultipleFCMTokensInfo> {
    this.초기화확인();
    try {
      const result = await this.sdkClient.fcm.getMultipleTokens({
        employeeNumbers: params.employeeNumbers,
      });

      const tokensInfo = {
        totalEmployees: result.totalEmployees,
        totalTokens: result.totalTokens,
        byEmployee: result.byEmployee.map((emp) => ({
          employeeNumber: emp.employeeNumber,
          tokens: emp.tokens.map((token) => ({
            fcmToken: token.fcmToken,
            deviceType: token.deviceType,
            createdAt: new Date(token.createdAt),
          })),
        })),
        allTokens: result.allTokens.map((token) => ({
          fcmToken: token.fcmToken,
          deviceType: token.deviceType,
          createdAt: new Date(token.createdAt),
        })),
      };

      // JSON 저장
      this.저장한다('여러직원의FCM토큰을조회한다', params, tokensInfo);

      return tokensInfo;
    } catch (error) {
      this.logger.error('여러 직원의 FCM 토큰 조회 실패', error);
      throw error;
    }
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
   * 부서 계층구조를 재귀적으로 순회하여 평면 목록으로 변환
   */
  async 모든부서정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentInfo[]> {
    const hierarchy = await this.부서계층구조를조회한다({
      ...params,
      includeEmptyDepartments: true,
      withEmployeeDetail: false,
    });

    const departments: DepartmentInfo[] = [];

    // 재귀적으로 부서 노드를 평면 목록으로 변환
    const flattenDepartments = (nodes: DepartmentNode[]): void => {
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

    // JSON 저장
    this.저장한다('모든부서정보를조회한다', params || {}, departments);

    return departments;
  }

  /**
   * SSO에서 모든 직원 정보를 평면 목록으로 조회한다
   * 부서 계층구조를 재귀적으로 순회하여 모든 부서의 직원 정보를 평면 목록으로 변환
   */
  async 모든직원정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<EmployeeInfo[]> {
    const hierarchy = await this.부서계층구조를조회한다({
      ...params,
      includeEmptyDepartments: true,
      withEmployeeDetail: true, // 직원 상세 정보 포함
    });

    const employees: EmployeeInfo[] = [];

    // 재귀적으로 부서 노드를 순회하여 직원 정보를 평면 목록으로 변환
    const flattenEmployees = (nodes: DepartmentNode[]): void => {
      for (const node of nodes) {
        // 현재 부서의 직원들을 추가
        if (node.employees && node.employees.length > 0) {
          employees.push(...node.employees);
        }

        // 하위 부서 재귀 호출
        if (node.children && node.children.length > 0) {
          flattenEmployees(node.children);
        }
      }
    };

    flattenEmployees(hierarchy.departments);

    // JSON 저장
    this.저장한다('모든직원정보를조회한다', params || {}, employees);

    return employees;
  }

  /**
   * 전체 직원의 관리자 정보를 조회한다
   * 각 직원의 소속 부서부터 최상위 부서까지 올라가면서 관리자 정보를 조회합니다.
   */
  async 직원관리자정보를조회한다(): Promise<GetEmployeesManagersResponse> {
    this.초기화확인();
    try {
      this.logger.log(
        `직원 관리자 정보 조회 요청 시작... baseUrl: ${this.config.baseUrl}`,
      );
      const startTime = Date.now();

      const result = await this.sdkClient.organization.getEmployeesManagers();

      const elapsedTime = Date.now() - startTime;
      this.logger.log(
        `직원 관리자 정보 조회 완료 (소요 시간: ${elapsedTime}ms)`,
      );

      // JSON 저장
      this.저장한다('직원관리자정보를조회한다', {}, result);

      return result;
    } catch (error) {
      // 타임아웃 에러인 경우 더 자세한 로그
      if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
        this.logger.error(
          `직원 관리자 정보 조회 타임아웃: ${error.message}. 현재 타임아웃 설정: ${this.config.timeoutMs}ms. SSO 서버 응답이 지연되고 있습니다.`,
        );
        this.logger.error(
          `타임아웃 상세 정보: baseUrl=${this.config.baseUrl}, 요청이 SSO 서버에 도달했는지 확인이 필요합니다.`,
        );
      } else {
        this.logger.error('직원 관리자 정보 조회 실패', error);
        this.logger.error(
          `에러 상세: code=${error?.code}, status=${error?.status}, message=${error?.message}, baseUrl=${this.config.baseUrl}`,
        );
      }
      throw error;
    }
  }

  // ========== 헬퍼 메서드 ==========

  private mapToEmployeeInfo(data: any): EmployeeInfo {
    // 실제 SSO 데이터 구조에 맞게 매핑
    // status 값을 enum으로 변환
    const mapStatusToEnum = (status: string | undefined): EmployeeStatus | undefined => {
      if (!status) return undefined;
      
      // 정확한 매칭
      if (status === '재직중' || status === 'ACTIVE' || status === 'active') {
        return EmployeeStatus.ACTIVE;
      }
      if (status === '휴직' || status === 'ON_LEAVE' || status === 'on_leave') {
        return EmployeeStatus.ON_LEAVE;
      }
      if (status === '퇴사' || status === 'TERMINATED' || status === 'terminated') {
        return EmployeeStatus.TERMINATED;
      }
      
      // 기본값: 알 수 없는 상태는 undefined로 반환
      return undefined;
    };

    const employeeStatus = mapStatusToEnum(data.status);
    
    // status가 "재직중"이면 isTerminated는 false, 그 외는 true
    const isTerminated =
      data.isTerminated !== undefined
        ? data.isTerminated
        : employeeStatus === EmployeeStatus.TERMINATED ||
          (employeeStatus !== EmployeeStatus.ACTIVE && employeeStatus !== EmployeeStatus.ON_LEAVE);

    return {
      id: data.id,
      employeeNumber: data.employeeNumber,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber || undefined,
      isTerminated,
      status: employeeStatus,
      hireDate: data.hireDate,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      department: data.department
        ? {
            id: data.department.id,
            departmentCode: data.department.departmentCode,
            departmentName: data.department.departmentName,
            parentDepartmentId: data.department.parentDepartmentId,
            type: data.department.type,
            order: data.department.order,
          }
        : undefined,
      position: data.position
        ? {
            id: data.position.id,
            positionName:
              data.position.positionTitle || data.position.positionName,
            positionLevel: data.position.level || data.position.positionLevel,
            positionCode: data.position.positionCode,
            hasManagementAuthority: data.position.hasManagementAuthority,
          }
        : undefined,
      jobTitle: data.rank
        ? {
            id: data.rank.id,
            jobTitleName: data.rank.rankName,
            jobTitleLevel: data.rank.level,
            jobTitleCode: data.rank.rankCode,
          }
        : data.jobTitle
          ? {
              id: data.jobTitle.id,
              jobTitleName: data.jobTitle.jobTitleName,
              jobTitleLevel: data.jobTitle.jobTitleLevel,
              jobTitleCode: data.jobTitle.jobTitleCode,
            }
          : undefined,
    };
  }

  private mapToDepartmentNode(data: any): DepartmentNode {
    // SSO SDK는 children 대신 childDepartments를 사용
    const childDepartments = data.childDepartments || data.children || [];

    return {
      id: data.id,
      departmentCode: data.departmentCode,
      departmentName: data.departmentName,
      parentDepartmentId: data.parentDepartmentId,
      depth: data.depth,
      employeeCount: data.employeeCount,
      employees: Array.isArray(data.employees)
        ? data.employees.map((emp) => this.mapToEmployeeInfo(emp))
        : [],
      children: Array.isArray(childDepartments)
        ? childDepartments.map((child) => this.mapToDepartmentNode(child))
        : [],
      type: data.type,
      order: data.order,
    };
  }
}
