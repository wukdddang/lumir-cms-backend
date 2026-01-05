/**
 * SSO FCM 토큰 관리 서비스 인터페이스
 */
export interface ISSOfcmService {
  /**
   * FCM 토큰을 구독한다 (앱 로그인 시)
   * @param params 구독 파라미터
   * @returns 구독 결과
   */
  FCM토큰을구독한다(params: SubscribeFCMParams): Promise<SubscribeFCMResult>;

  /**
   * FCM 토큰 구독을 해지한다 (앱 로그아웃 시 - 모든 토큰 해지)
   * @param params 구독 해지 파라미터
   * @returns 구독 해지 결과
   */
  FCM토큰을구독해지한다(
    params: UnsubscribeFCMParams,
  ): Promise<UnsubscribeFCMResult>;

  /**
   * FCM 토큰을 조회한다
   * @param params 조회 파라미터
   * @returns 토큰 정보
   */
  FCM토큰을조회한다(params: GetFCMTokenParams): Promise<FCMTokenInfo>;

  /**
   * 여러 직원의 FCM 토큰을 조회한다 (알림 서버용)
   * @param params 조회 파라미터
   * @returns 여러 직원의 토큰 정보
   */
  여러직원의FCM토큰을조회한다(
    params: GetMultipleFCMTokensParams,
  ): Promise<MultipleFCMTokensInfo>;
}

/**
 * 디바이스 타입
 */
export type DeviceType = 'android' | 'ios' | 'pc' | 'web';

/**
 * FCM 토큰 구독 파라미터
 */
export interface SubscribeFCMParams {
  /** 사번 */
  employeeNumber: string;
  /** FCM 토큰 */
  fcmToken: string;
  /** 디바이스 타입 */
  deviceType: DeviceType;
}

/**
 * FCM 토큰 구독 결과
 */
export interface SubscribeFCMResult {
  success: boolean;
  fcmToken: string;
  employeeNumber: string;
  deviceType: DeviceType;
}

/**
 * FCM 토큰 구독 해지 파라미터
 */
export interface UnsubscribeFCMParams {
  /** 사번 */
  employeeNumber: string;
}

/**
 * FCM 토큰 구독 해지 결과
 */
export interface UnsubscribeFCMResult {
  success: boolean;
  deletedCount: number;
  message?: string;
}

/**
 * FCM 토큰 조회 파라미터
 */
export interface GetFCMTokenParams {
  /** 사번 */
  employeeNumber: string;
}

/**
 * FCM 토큰 정보
 */
export interface FCMTokenInfo {
  employeeNumber: string;
  tokens: FCMToken[];
}

/**
 * FCM 토큰
 */
export interface FCMToken {
  fcmToken: string;
  deviceType: DeviceType;
  createdAt: Date;
}

/**
 * 여러 직원의 FCM 토큰 조회 파라미터
 */
export interface GetMultipleFCMTokensParams {
  /** 사번 배열 */
  employeeNumbers: string[];
}

/**
 * 여러 직원의 FCM 토큰 정보
 */
export interface MultipleFCMTokensInfo {
  totalEmployees: number;
  totalTokens: number;
  byEmployee: EmployeeFCMTokens[];
  allTokens: FCMToken[];
}

/**
 * 직원별 FCM 토큰
 */
export interface EmployeeFCMTokens {
  employeeNumber: string;
  tokens: FCMToken[];
}
