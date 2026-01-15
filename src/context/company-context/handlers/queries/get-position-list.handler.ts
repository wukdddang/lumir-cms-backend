import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PositionListResult } from '../../interfaces/company-context.interface';

/**
 * 직책 목록 조회 쿼리
 */
export class GetPositionListQuery {
  constructor() {}
}

/**
 * 직책 목록 조회 핸들러
 *
 * SSO 서버로부터 직책 목록을 가져옵니다.
 */
@Injectable()
@QueryHandler(GetPositionListQuery)
export class GetPositionListHandler implements IQueryHandler<GetPositionListQuery> {
  private readonly logger = new Logger(GetPositionListHandler.name);
  private readonly ssoBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>('SSO_BASE_URL') || '';
    // trailing slash 제거
    this.ssoBaseUrl = baseUrl.replace(/\/$/, '');

    if (!this.ssoBaseUrl) {
      this.logger.warn('SSO_BASE_URL이 설정되지 않았습니다.');
    }
  }

  async execute(query: GetPositionListQuery): Promise<PositionListResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.ssoBaseUrl}/api/admin/organizations/positions`,
        ),
      );

      const positionList = response.data as PositionListResult;

      // isActive가 true인 직책만 필터링 (isActive 필드가 없으면 모두 포함)
      const activePositions = positionList.filter(
        (position) => position.isActive === undefined || position.isActive,
      );

      return activePositions;
    } catch (error) {
      this.logger.error('직책 목록 조회 실패', error);
      throw new Error('직책 목록을 가져오는데 실패했습니다.');
    }
  }
}
