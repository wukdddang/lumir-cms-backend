import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AdminService } from '@domain/common/admin/admin.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Admin 가드
 *
 * 토큰의 사번(employeeNumber)이 Admin 테이블에 등록되어 있는지 확인합니다.
 * @Public() 데코레이터가 있는 엔드포인트는 검증을 건너뜁니다.
 *
 * @remarks
 * JwtAuthGuard 이후에 실행되어야 합니다.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(
    private readonly adminService: AdminService,
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
    const user = request['user'];

    // JwtAuthGuard를 먼저 적용해야 함
    if (!user) {
      this.logger.warn(
        '사용자 정보가 없습니다. JwtAuthGuard를 먼저 적용해주세요.',
      );
      throw new ForbiddenException('인증이 필요합니다.');
    }

    const employeeNumber = user.employeeNumber;

    if (!employeeNumber) {
      this.logger.warn(`사번 정보가 없습니다: 사용자 ${user.email}`);
      throw new ForbiddenException('사번 정보가 없습니다.');
    }

    // Admin 테이블에 사번이 등록되어 있는지 확인
    const isAdmin = await this.adminService.관리자인지_확인한다(employeeNumber);

    if (!isAdmin) {
      this.logger.warn(
        `관리자 권한이 없습니다: 사번 ${employeeNumber}, 이메일 ${user.email}`,
      );
      throw new ForbiddenException(
        'CMS 백엔드 접근 권한이 없습니다. 관리자에게 문의하세요.',
      );
    }

    this.logger.debug(`관리자 인증 성공: 사번 ${employeeNumber}`);
    return true;
  }
}
