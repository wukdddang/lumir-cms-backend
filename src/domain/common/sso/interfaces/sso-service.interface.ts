import {
  ChangePasswordResult,
  CheckPasswordResult,
  DepartmentHierarchy,
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
} from './index';

/**
 * SSO 서비스 통합 인터페이스
 * 모든 SSO 관련 기능을 제공하는 통합 인터페이스
 */
export interface ISSOService {
  /**
   * 시스템 인증을 수행한다
   */
  초기화한다(): Promise<void>;

  // ========== 인증 관련 메서드 ==========

  /**
   * 사용자 로그인을 수행한다
   */
  로그인한다(email: string, password: string): Promise<LoginResult>;

  /**
   * 액세스 토큰을 검증한다
   */
  토큰을검증한다(accessToken: string): Promise<VerifyTokenResult>;

  /**
   * 리프레시 토큰으로 액세스 토큰을 갱신한다
   */
  토큰을갱신한다(refreshToken: string): Promise<RefreshTokenResult>;

  /**
   * 현재 비밀번호를 확인한다
   */
  비밀번호를확인한다(
    accessToken: string,
    password: string,
    email: string,
  ): Promise<CheckPasswordResult>;

  /**
   * 비밀번호를 변경한다
   */
  비밀번호를변경한다(
    accessToken: string,
    newPassword: string,
  ): Promise<ChangePasswordResult>;

  // ========== 조직 정보 조회 메서드 ==========

  /**
   * 직원 정보를 조회한다
   */
  직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo>;

  /**
   * 여러 직원의 정보를 조회한다
   */
  여러직원정보를조회한다(params: GetEmployeesParams): Promise<EmployeeInfo[]>;

  /**
   * 여러 직원의 원시 정보를 조회한다 (동기화용)
   * EmployeeInfo로 변환하지 않고 SSO 원시 데이터를 그대로 반환
   */
  여러직원원시정보를조회한다(params: GetEmployeesParams): Promise<any[]>;

  /**
   * 부서 계층구조를 조회한다
   */
  부서계층구조를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<DepartmentHierarchy>;

  /**
   * 전체 직원의 관리자 정보를 조회한다
   */
  직원관리자정보를조회한다(): Promise<GetEmployeesManagersResponse>;

  // ========== FCM 토큰 관리 메서드 ==========

  /**
   * FCM 토큰을 구독한다 (앱 로그인 시)
   */
  FCM토큰을구독한다(params: SubscribeFCMParams): Promise<SubscribeFCMResult>;

  /**
   * FCM 토큰 구독을 해지한다 (앱 로그아웃 시)
   */
  FCM토큰을구독해지한다(
    params: UnsubscribeFCMParams,
  ): Promise<UnsubscribeFCMResult>;

  /**
   * FCM 토큰을 조회한다
   */
  FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo>;

  /**
   * 여러 직원의 FCM 토큰을 조회한다 (알림 서버용)
   */
  여러직원의FCM토큰을조회한다(
    params: GetMultipleFCMTokensParams,
  ): Promise<MultipleFCMTokensInfo>;

  // ========== 편의 메서드 ==========

  /**
   * 사번으로 직원 정보를 조회한다 (상세 정보 포함)
   */
  사번으로직원을조회한다(employeeNumber: string): Promise<EmployeeInfo>;

  /**
   * 이메일로 직원 정보를 조회한다
   */
  이메일로직원을조회한다(email: string): Promise<EmployeeInfo | null>;

  /**
   * SSO에서 모든 부서 정보를 평면 목록으로 조회한다
   */
  모든부서정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<import('./sso-organization.interface').DepartmentInfo[]>;

  /**
   * SSO에서 모든 직원 정보를 평면 목록으로 조회한다
   */
  모든직원정보를조회한다(
    params?: GetDepartmentHierarchyParams,
  ): Promise<EmployeeInfo[]>;
}
