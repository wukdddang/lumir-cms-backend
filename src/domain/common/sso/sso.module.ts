import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SSOServiceFactory } from './sso.service.factory';
import { SSOClientConfig, ISSOService } from './interfaces';

/**
 * SSO 서비스 토큰
 * 하위 호환성을 위해 기존 SSOService 이름을 토큰으로 사용
 */
export const SSOService = Symbol('SSOService');

/**
 * SSO 모듈
 * SSO SDK를 NestJS에 통합하여 제공한다
 * 팩토리 패턴을 사용하여 환경에 따라 실제 서비스 또는 Mock 서비스를 제공한다
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SSO_CONFIG',
      useFactory: (configService: ConfigService): SSOClientConfig => {
        const config: SSOClientConfig = {
          baseUrl:
            configService.get<string>('SSO_BASE_URL') ||
            'https://lsso.vercel.app',
          clientId: configService.get<string>('SSO_CLIENT_ID') || '',
          clientSecret: configService.get<string>('SSO_CLIENT_SECRET') || '',
          timeoutMs: configService.get<number>('SSO_TIMEOUT_MS') || 30000,
          retries: configService.get<number>('SSO_RETRIES') || 2,
          retryDelay: configService.get<number>('SSO_RETRY_DELAY') || 1000,
          enableLogging: false,
        };

        // 필수 설정 검증 (Mock 서비스 사용 시에는 검증 건너뛰기)
        const useMockService =
          configService.get<string>('SSO_USE_MOCK') === 'true' ||
          configService.get<string>('NODE_ENV') === 'test';

        if (!useMockService && (!config.clientId || !config.clientSecret)) {
          throw new Error(
            'SSO_CLIENT_ID와 SSO_CLIENT_SECRET 환경 변수가 필요합니다.',
          );
        }

        return config;
      },
      inject: [ConfigService],
    },
    {
      provide: 'SSO_SYSTEM_NAME',
      useFactory: (configService: ConfigService): string => {
        return configService.get<string>('SSO_SYSTEM_NAME') || 'EMS-PROD';
      },
      inject: [ConfigService],
    },
    SSOServiceFactory,
    {
      // 기존 SSOService를 팩토리에서 생성한 서비스로 제공 (하위 호환성)
      provide: SSOService,
      useFactory: (factory: SSOServiceFactory): ISSOService => {
        return factory.create();
      },
      inject: [SSOServiceFactory],
    },
  ],
  exports: ['SSO_CONFIG', 'SSO_SYSTEM_NAME', SSOService, SSOServiceFactory],
})
export class SSOModule implements OnModuleInit {
  constructor(private readonly factory: SSOServiceFactory) {}

  async onModuleInit(): Promise<void> {
    await this.factory.initialize();
  }
}
