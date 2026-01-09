import { Injectable, Logger } from '@nestjs/common';

/**
 * 사용자 정보 캐시 서비스
 *
 * 로그인 시 받은 사용자 정보를 메모리에 저장하고,
 * 토큰 검증 시 JWT의 ID로 조회할 수 있도록 합니다.
 */
@Injectable()
export class UserCacheService {
  private readonly logger = new Logger(UserCacheService.name);
  private readonly userCache = new Map<
    string,
    {
      id: string;
      email: string;
      name: string;
      employeeNumber: string;
      status: string;
    }
  >();

  /**
   * 사용자 정보를 캐시에 저장한다
   */
  setUser(userId: string, userInfo: {
    id: string;
    email: string;
    name: string;
    employeeNumber: string;
    status: string;
  }): void {
    this.userCache.set(userId, userInfo);
    this.logger.debug(`사용자 정보 캐시 저장: ${userId} (${userInfo.email})`);
  }

  /**
   * 캐시에서 사용자 정보를 조회한다
   */
  getUser(userId: string): {
    id: string;
    email: string;
    name: string;
    employeeNumber: string;
    status: string;
  } | null {
    const userInfo = this.userCache.get(userId);
    if (userInfo) {
      this.logger.debug(`사용자 정보 캐시 조회: ${userId} (${userInfo.email})`);
    }
    return userInfo || null;
  }

  /**
   * 캐시에서 사용자 정보를 삭제한다
   */
  removeUser(userId: string): void {
    this.userCache.delete(userId);
    this.logger.debug(`사용자 정보 캐시 삭제: ${userId}`);
  }
}
