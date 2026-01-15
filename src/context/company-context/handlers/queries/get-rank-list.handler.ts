import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RankListResult } from '../../interfaces/company-context.interface';

/**
 * 직급 목록 조회 쿼리
 */
export class GetRankListQuery {
  constructor() {}
}

/**
 * 직급 목록 조회 핸들러
 *
 * SSO 서버로부터 직급 목록을 가져옵니다.
 */
@Injectable()
@QueryHandler(GetRankListQuery)
export class GetRankListHandler implements IQueryHandler<GetRankListQuery> {
  private readonly logger = new Logger(GetRankListHandler.name);
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

  async execute(query: GetRankListQuery): Promise<RankListResult> {
    this.logger.debug('직급 목록 조회 시작 (isActive 필터링)');

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.ssoBaseUrl}/api/admin/organizations/ranks`,
        ),
      );

      const rankList = response.data as RankListResult;

      // isActive가 true인 직급만 필터링 (isActive 필드가 없으면 모두 포함)
      const activeRanks = rankList.filter(
        (rank) => rank.isActive === undefined || rank.isActive,
      );

      this.logger.debug(
        `직급 목록 조회 완료 (전체: ${rankList.length}개 → 활성: ${activeRanks.length}개)`,
      );

      return activeRanks;
    } catch (error) {
      this.logger.error('직급 목록 조회 실패', error);
      throw new Error('직급 목록을 가져오는데 실패했습니다.');
    }
  }
}
