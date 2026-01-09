/**
 * 인증 컨텍스트 인터페이스
 */

/**
 * SSO 로그인 요청
 */
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

/**
 * SSO 로그인 결과
 */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    externalId: string;
    email: string;
    name: string;
    employeeNumber: string;
    roles: string[];
    status: string;
  };
}

/**
 * 토큰 검증 요청
 */
export class VerifyTokenCommand {
  constructor(public readonly accessToken: string) {}
}

/**
 * 토큰 검증 결과
 */
export interface VerifyTokenResult {
  user: {
    id: string;
    email: string;
    name: string;
    employeeNumber: string;
    roles: string[];
    status?: string;
  };
}

/**
 * 현재 사용자 조회 결과
 */
export interface GetCurrentUserResult {
  user: {
    id: string;
    email: string;
    name: string;
  };
}
