import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthContextService } from '@context/auth-context';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT 인증 가드
 *
 * Auth Context를 통해 토큰을 검증하고 사용자 정보를 주입합니다.
 * @Public() 데코레이터가 있는 엔드포인트는 인증을 건너뜁니다.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly authContextService: AuthContextService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있는지 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      // Auth Context를 통해 토큰 검증 및 사용자 정보 조회
      const result = await this.authContextService.토큰을_검증한다(token);

      // 검증된 사용자 정보를 Request에 주입
      request['user'] = {
        id: result.user.id,
        externalId: result.user.id, // SSO ID를 externalId로 사용
        email: result.user.email,
        name: result.user.name,
        employeeNumber: result.user.employeeNumber,
        roles: result.user.roles,
        status: result.user.status || 'ACTIVE',
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('토큰 검증 중 오류 발생:', error);
      throw new UnauthorizedException('토큰 검증에 실패했습니다.');
    }
  }

  /**
   * Authorization 헤더에서 Bearer 토큰을 추출합니다
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}

// Request 객체에 user 속성을 추가하기 위한 타입 확장
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      externalId: string;
      email: string;
      name: string;
      employeeNumber: string;
      roles: string[];
      status: string;
    };
  }
}
