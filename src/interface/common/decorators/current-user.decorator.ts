import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 사용자 데코레이터
 *
 * JWT 인증된 사용자 정보를 가져옵니다.
 * JwtAuthGuard 이후에만 사용할 수 있습니다.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * 인증된 사용자 타입
 */
export interface AuthenticatedUser {
  id: string;
  externalId: string;
  email: string;
  name: string;
  employeeNumber: string;
  roles: string[];
  status: string;
}
