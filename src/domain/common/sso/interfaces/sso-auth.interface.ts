/**
 * SSO 인증 서비스 인터페이스
 */
export interface ISSOAuthService {
  /**
   * 사용자 로그인을 수행한다
   * @param email 이메일
   * @param password 비밀번호
   * @returns 로그인 결과 (사용자 정보 및 토큰)
   */
  로그인한다(email: string, password: string): Promise<LoginResult>;

  /**
   * 액세스 토큰을 검증한다
   * @param accessToken 액세스 토큰
   * @returns 토큰 검증 결과
   */
  토큰을검증한다(accessToken: string): Promise<VerifyTokenResult>;

  /**
   * 리프레시 토큰으로 액세스 토큰을 갱신한다
   * @param refreshToken 리프레시 토큰
   * @returns 갱신된 토큰 정보
   */
  토큰을갱신한다(refreshToken: string): Promise<RefreshTokenResult>;

  /**
   * 현재 비밀번호를 확인한다
   * @param accessToken 액세스 토큰
   * @param password 확인할 비밀번호
   * @param email 이메일
   * @returns 비밀번호 확인 결과
   */
  비밀번호를확인한다(
    accessToken: string,
    password: string,
    email: string,
  ): Promise<CheckPasswordResult>;

  /**
   * 비밀번호를 변경한다
   * @param accessToken 액세스 토큰
   * @param newPassword 새 비밀번호
   * @returns 비밀번호 변경 결과
   */
  비밀번호를변경한다(
    accessToken: string,
    newPassword: string,
  ): Promise<ChangePasswordResult>;
}

/**
 * 로그인 결과
 */
export interface LoginResult {
  id: string;
  email: string;
  name: string;
  employeeNumber: string;
  accessToken: string;
  refreshToken: string;
  /** 시스템별 역할 정보 (예: { "RMS-PROD": ["resourceManager", "systemAdmin"] }) */
  systemRoles?: Record<string, string[]>;
}

/**
 * SSO 서버에서 반환하는 사용자 정보
 */
export interface SSOUserInfo {
  id: string;
  name: string;
  email: string;
  employee_number: string;
}

/**
 * 토큰 검증 결과
 */
export interface VerifyTokenResult {
  valid: boolean;
  user_info: SSOUserInfo;
  expires_in: number;
}

/**
 * 토큰 갱신 결과
 */
export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * 비밀번호 확인 결과
 */
export interface CheckPasswordResult {
  valid: boolean;
  message?: string;
}

/**
 * 비밀번호 변경 결과
 */
export interface ChangePasswordResult {
  success: boolean;
  message?: string;
}
