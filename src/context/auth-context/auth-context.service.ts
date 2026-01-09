import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LoginHandler } from './handlers/commands/login.handler';
import { VerifyTokenHandler } from './handlers/commands/verify-token.handler';
import {
  LoginCommand,
  LoginResult,
  VerifyTokenCommand,
  VerifyTokenResult,
} from './interfaces/auth-context.interface';

/**
 * 인증 컨텍스트 서비스
 *
 * SSO 인증 및 토큰 검증을 담당합니다.
 */
@Injectable()
export class AuthContextService {
  private readonly logger = new Logger(AuthContextService.name);

  constructor(
    private readonly loginHandler: LoginHandler,
    private readonly verifyTokenHandler: VerifyTokenHandler,
  ) {}

  /**
   * 로그인한다
   */
  async 로그인한다(email: string, password: string): Promise<LoginResult> {
    this.logger.log(`로그인 시도: ${email}`);

    const command = new LoginCommand(email, password);
    return await this.loginHandler.execute(command);
  }

  /**
   * 토큰을_검증한다
   */
  async 토큰을_검증한다(accessToken: string): Promise<VerifyTokenResult> {
    this.logger.debug('토큰 검증 시작');

    const command = new VerifyTokenCommand(accessToken);
    return await this.verifyTokenHandler.execute(command);
  }
}
