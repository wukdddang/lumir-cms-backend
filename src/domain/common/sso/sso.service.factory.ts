import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISSOService } from './interfaces';
import { SSOServiceImpl } from './sso.service.impl';
import { MockSSOService } from './sso.service.mock';

/**
 * SSO 서비스 팩토리
 * 환경 설정에 따라 실제 SSO 서비스 또는 Mock 서비스를 반환한다
 */
@Injectable()
export class SSOServiceFactory {
  private readonly logger = new Logger(SSOServiceFactory.name);
  private serviceInstance: ISSOService | null = null;

  constructor(
    @Inject('SSO_CONFIG') private readonly config: any,
    @Inject('SSO_SYSTEM_NAME') private readonly systemName: string,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 환경에 따라 적절한 SSO 서비스를 생성한다
   */
  create(): ISSOService {
    if (this.serviceInstance) {
      return this.serviceInstance;
    }

    const useMockService =
      this.configService.get<string>('SSO_USE_MOCK') === 'true' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (useMockService) {
      this.logger.log(
        'Mock SSO 서비스를 사용합니다 (JSON 파일에서 데이터 로드)',
      );
      this.serviceInstance = new MockSSOService();
    } else {
      this.logger.log('실제 SSO 서비스를 사용합니다 (외부 API 연동)');
      const enableJsonStorage =
        this.configService.get<string>('SSO_ENABLE_JSON_STORAGE') === 'true';

      this.serviceInstance = new SSOServiceImpl(
        this.config,
        this.systemName,
        enableJsonStorage,
      );
    }

    return this.serviceInstance;
  }

  /**
   * 서비스 인스턴스를 초기화한다
   */
  async initialize(): Promise<void> {
    const service = this.create();
    await service.초기화한다();
  }
}

