import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageView } from './page-view.entity';

/**
 * PageView 도메인 서비스
 */
@Injectable()
export class PageViewService {
  constructor(
    @InjectRepository(PageView)
    private readonly pageViewRepository: Repository<PageView>,
  ) {}

  /**
   * 페이지 조회 통계를 생성한다
   */
  async 페이지_조회를_생성한다(pageView: Partial<PageView>): Promise<PageView> {
    const entity = this.pageViewRepository.create(pageView);
    return await this.pageViewRepository.save(entity);
  }

  /**
   * 세션 ID로 페이지 조회 목록을 조회한다
   */
  async 세션_ID로_조회한다(sessionId: string): Promise<PageView[]> {
    return await this.pageViewRepository.find({
      where: { sessionId },
      order: { enterTime: 'ASC' },
    });
  }

  /**
   * 페이지별 조회 통계를 조회한다
   */
  async 페이지별_통계를_조회한다(
    startDate: Date,
    endDate: Date,
  ): Promise<{ pageName: string; count: number; avgDuration: number }[]> {
    return await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.pageName', 'pageName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(pv.stayDuration)', 'avgDuration')
      .where('pv.enterTime >= :startDate', { startDate })
      .andWhere('pv.enterTime <= :endDate', { endDate })
      .groupBy('pv.pageName')
      .getRawMany();
  }
}
