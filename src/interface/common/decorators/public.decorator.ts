import { SetMetadata } from '@nestjs/common';

/**
 * Public 키
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public 데코레이터
 *
 * 이 데코레이터가 적용된 엔드포인트는 인증을 건너뜁니다.
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * checkHealth() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
