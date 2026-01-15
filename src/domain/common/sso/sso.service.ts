import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * SSO 부서 정보
 */
export interface SsoDepartmentInfo {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
}

/**
 * SSO 직원 정보
 */
export interface SsoEmployeeInfo {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  rankCode: string;
  positionCode: string;
}

/**
 * FCM 토큰 정보 (직원별)
 */
export interface FcmTokenByEmployee {
  employeeId: string;
  employeeNumber: string;
  tokens: Array<{
    fcmToken: string;
    deviceType: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * FCM 토큰 정보 (플랫)
 */
export interface FcmTokenFlat {
  employeeId: string;
  employeeNumber: string;
  fcmToken: string;
  deviceType: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * FCM 토큰 조회 응답
 */
export interface FcmTokenResponse {
  byEmployee: FcmTokenByEmployee[];
  allTokens: FcmTokenFlat[];
  totalEmployees: number;
  totalTokens: number;
}

/**
 * Portal FCM 토큰 정보 (필터링된)
 */
export interface PortalFcmTokenInfo {
  employeeId: string;
  employeeNumber: string;
  tokens: string[]; // Portal FCM 토큰만
}

/**
 * SSO 서비스
 * 
 * SSO API를 통해 조직 정보와 FCM 토큰을 조회합니다.
 */
@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);
  private readonly ssoBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.ssoBaseUrl = this.configService.get<string>('SSO_BASE_URL') || '';
  }

  /**
   * SSO에서 부서 정보를 조회한다
   * 
   * @param departmentId 부서 ID
   * @returns 부서 정보 또는 null (존재하지 않는 경우)
   */
  async 부서_정보를_조회한다(
    departmentId: string,
  ): Promise<SsoDepartmentInfo | null> {
    try {
      const response = await axios.get<SsoDepartmentInfo>(
        `${this.ssoBaseUrl}/api/admin/organizations/departments/${departmentId}`,
        {
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const url = `${this.ssoBaseUrl}/api/admin/organizations/departments/${departmentId}`;
        
        if (status === 404) {
          // 부서가 존재하지 않음
          this.logger.debug(`부서 정보 없음 - ID: ${departmentId}`);
          return null;
        }
        
        if (status === 500) {
          // SSO 서버 에러 - 상세 메시지 로그 출력
          this.logger.warn(
            `SSO 서버 에러 (부서 조회) - ` +
            `ID: ${departmentId}, ` +
            `Status: 500, ` +
            `URL: ${url}, ` +
            `응답: ${JSON.stringify(errorData)}`,
          );
          return null;
        }
        
        if (status) {
          // 기타 HTTP 에러 (400, 403 등)
          this.logger.warn(
            `SSO 서버 에러 (부서 조회) - ` +
            `ID: ${departmentId}, ` +
            `Status: ${status}, ` +
            `URL: ${url}, ` +
            `응답: ${JSON.stringify(errorData)}`,
          );
          return null;
        }
      }

      // 네트워크 에러 등 기타 에러는 로그만 남기고 null 반환
      this.logger.error(
        `부서 정보 조회 실패 - ID: ${departmentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /**
   * SSO에서 직원 정보를 조회한다
   * 
   * @param employeeId 직원 ID
   * @returns 직원 정보 또는 null (존재하지 않는 경우)
   */
  async 직원_정보를_조회한다(
    employeeId: string,
  ): Promise<SsoEmployeeInfo | null> {
    try {
      const response = await axios.get<SsoEmployeeInfo>(
        `${this.ssoBaseUrl}/api/admin/organizations/employees/${employeeId}`,
        {
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const url = `${this.ssoBaseUrl}/api/admin/organizations/employees/${employeeId}`;
        
        if (status === 404) {
          // 직원이 존재하지 않음
          this.logger.debug(`직원 정보 없음 - ID: ${employeeId}`);
          return null;
        }
        
        if (status === 500) {
          // SSO 서버 에러 - 상세 메시지 로그 출력
          this.logger.warn(
            `SSO 서버 에러 (직원 조회) - ` +
            `ID: ${employeeId}, ` +
            `Status: 500, ` +
            `URL: ${url}, ` +
            `응답: ${JSON.stringify(errorData)}`,
          );
          return null;
        }
        
        if (status) {
          // 기타 HTTP 에러 (400, 403 등)
          this.logger.warn(
            `SSO 서버 에러 (직원 조회) - ` +
            `ID: ${employeeId}, ` +
            `Status: ${status}, ` +
            `URL: ${url}, ` +
            `응답: ${JSON.stringify(errorData)}`,
          );
          return null;
        }
      }

      // 네트워크 에러 등 기타 에러는 로그만 남기고 null 반환
      this.logger.error(
        `직원 정보 조회 실패 - ID: ${employeeId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /**
   * 여러 부서의 정보를 일괄 조회한다
   * 
   * @param departmentIds 부서 ID 목록
   * @returns 부서 ID와 정보의 맵 (존재하지 않는 경우 null)
   */
  async 부서_정보_목록을_조회한다(
    departmentIds: string[],
  ): Promise<Map<string, SsoDepartmentInfo | null>> {
    const result = new Map<string, SsoDepartmentInfo | null>();

    // 병렬로 조회
    await Promise.all(
      departmentIds.map(async (id) => {
        const info = await this.부서_정보를_조회한다(id);
        result.set(id, info);
      }),
    );

    return result;
  }

  /**
   * 여러 직원의 정보를 일괄 조회한다
   * 
   * @param employeeIds 직원 ID 목록
   * @returns 직원 ID와 정보의 맵 (존재하지 않는 경우 null)
   */
  async 직원_정보_목록을_조회한다(
    employeeIds: string[],
  ): Promise<Map<string, SsoEmployeeInfo | null>> {
    const result = new Map<string, SsoEmployeeInfo | null>();

    // 병렬로 조회
    await Promise.all(
      employeeIds.map(async (id) => {
        const info = await this.직원_정보를_조회한다(id);
        result.set(id, info);
      }),
    );

    return result;
  }

  /**
   * FCM 토큰을 조회한다
   * 
   * @param params employeeNumbers 또는 employeeIds (쉼표로 구분된 문자열 또는 배열)
   * @returns Portal FCM 토큰이 있는 수신자 목록
   */
  async FCM_토큰을_조회한다(params: {
    employeeNumbers?: string | string[];
    employeeIds?: string | string[];
  }): Promise<PortalFcmTokenInfo[]> {
    try {
      // 쉼표로 구분된 문자열을 배열로 변환
      const employeeNumbers = this.파라미터를_배열로_변환한다(
        params.employeeNumbers,
      );
      const employeeIds = this.파라미터를_배열로_변환한다(params.employeeIds);

      this.logger.debug(
        `FCM 토큰 조회 - employeeNumbers: ${employeeNumbers?.length || 0}명, employeeIds: ${employeeIds?.length || 0}명`,
      );

      const response = await axios.post<FcmTokenResponse>(
        `${this.ssoBaseUrl}/api/fcm/tokens`,
        {
          employeeNumbers,
          employeeIds,
        },
        {
          timeout: 10000,
        },
      );

      const fcmData = response.data;

      if (!fcmData.byEmployee || fcmData.byEmployee.length === 0) {
        this.logger.warn('FCM 토큰이 있는 수신자가 없습니다.');
        return [];
      }

      // deviceType에 'portal'이 포함된 FCM 토큰만 필터링
      const recipients: PortalFcmTokenInfo[] = fcmData.byEmployee
        .map((emp) => ({
          employeeId: emp.employeeId,
          employeeNumber: emp.employeeNumber,
          tokens: emp.tokens
            .filter((token) =>
              token.deviceType.toLowerCase().includes('portal'),
            )
            .map((t) => t.fcmToken),
        }))
        .filter((emp) => emp.tokens.length > 0);

      this.logger.debug(
        `Portal FCM 토큰 조회 완료: ${recipients.length}명의 수신자`,
      );

      return recipients;
    } catch (error) {
      this.logger.error(
        `FCM 토큰 조회 실패`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * 파라미터를 배열로 변환한다 (쉼표로 구분된 문자열 또는 배열)
   * @private
   */
  private 파라미터를_배열로_변환한다(
    param: string | string[] | undefined,
  ): string[] | undefined {
    if (!param) {
      return undefined;
    }

    if (typeof param === 'string') {
      // 쉼표로 구분된 문자열을 배열로 변환
      return param.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    }

    return param;
  }
}
