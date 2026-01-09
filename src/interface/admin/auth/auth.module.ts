import { Module } from '@nestjs/common';
import { AuthContextModule } from '@context/auth-context';
import { AuthController } from './auth.controller';

/**
 * 인증 인터페이스 모듈
 */
@Module({
  imports: [AuthContextModule],
  controllers: [AuthController],
})
export class AuthInterfaceModule {}
