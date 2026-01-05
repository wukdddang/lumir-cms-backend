import { ISSOAuthService } from './sso-auth.interface';
import { ISSOOrganizationService } from './sso-organization.interface';
import { ISSOfcmService } from './sso-fcm.interface';

/**
 * SSO 클라이언트 인터페이스
 */
export interface ISSOClient {
  /**
   * 시스템 인증을 수행한다
   * clientId와 clientSecret을 사용하여 Basic Auth 인증을 수행하고
   * X-System-Name 헤더를 자동으로 설정한다
   */
  초기화한다(): Promise<void>;

  /**
   * 인증 관련 서비스
   */
  readonly auth: ISSOAuthService;

  /**
   * 조직 정보 조회 서비스
   */
  readonly organization: ISSOOrganizationService;

  /**
   * FCM 토큰 관리 서비스
   */
  readonly fcm: ISSOfcmService;
}

/**
 * SSO 클라이언트 설정
 */
export interface SSOClientConfig {
  /** API 서버 URL */
  baseUrl: string;
  /** 시스템 클라이언트 ID */
  clientId: string;
  /** 시스템 클라이언트 Secret */
  clientSecret: string;
  /** 시스템 이름 (선택, 수동 설정 시 initialize() 건너뛰기) */
  systemName?: string;
  /** 타임아웃 (ms, 기본값: 10000) */
  timeoutMs?: number;
  /** 재시도 횟수 (기본값: 3) */
  retries?: number;
  /** 재시도 지연 (ms, 기본값: 200) */
  retryDelay?: number;
  /** 로깅 활성화 (기본값: false) */
  enableLogging?: boolean;
}
