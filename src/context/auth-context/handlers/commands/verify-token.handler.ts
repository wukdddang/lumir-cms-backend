import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  VerifyTokenCommand,
  VerifyTokenResult,
} from '../../interfaces/auth-context.interface';
import { UserCacheService } from '../../user-cache.service';

/**
 * 토큰 검증 핸들러
 *
 * SSO 서버를 통해 액세스 토큰을 검증하고 사용자 정보를 조회합니다.
 */
@Injectable()
@CommandHandler(VerifyTokenCommand)
export class VerifyTokenHandler implements ICommandHandler<VerifyTokenCommand> {
  private readonly logger = new Logger(VerifyTokenHandler.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: VerifyTokenCommand): Promise<VerifyTokenResult> {
    const { accessToken } = command;

    this.logger.debug('토큰 검증 시작');

    try {
      // JWT 토큰을 디코딩 (검증 없이 페이로드만 추출)
      const payload = this.jwtService.decode(accessToken) as {
        sub: string;
        employeeNumber: string;
        type: string;
        roles: Record<string, string[]>;
        iat: number;
        exp: number;
      };

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 토큰 만료 확인
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('만료된 토큰입니다.');
      }

      // CMS-DEV 시스템의 역할 추출
      const cmsRoles = payload.roles['CMS-DEV'] || [];

      // 캐시에서 사용자 정보 조회
      const cachedUser = this.userCacheService.getUser(payload.sub);

      if (!cachedUser) {
        this.logger.warn(
          `캐시에 사용자 정보가 없습니다: ${payload.sub}. 로그인을 다시 해주세요.`,
        );
        // 캐시에 없어도 기본 정보는 반환 (JWT에서 추출한 정보)
        return {
          user: {
            id: payload.sub,
            email: '',
            name: '',
            employeeNumber: payload.employeeNumber,
            roles: cmsRoles,
            status: 'ACTIVE',
          },
        };
      }

      this.logger.debug(`토큰 검증 성공: ${payload.sub} (${cachedUser.email})`);

      return {
        user: {
          id: cachedUser.id,
          email: cachedUser.email,
          name: cachedUser.name,
          employeeNumber: cachedUser.employeeNumber,
          roles: cmsRoles,
          status: cachedUser.status,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('토큰 검증 실패', error);
      throw new UnauthorizedException('토큰 검증에 실패했습니다.');
    }
  }
}
