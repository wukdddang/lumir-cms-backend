import { Injectable, Logger } from '@nestjs/common';
import { AnnouncementContextService } from '@context/announcement-context/announcement-context.service';
import { CompanyContextService } from '@context/company-context/company-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { Announcement } from '@domain/core/announcement/announcement.entity';
import { ContentStatus } from '@domain/core/content-status.types';
import { Category } from '@domain/common/category/category.entity';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '@context/announcement-context/interfaces/announcement-context.interface';
import {
  OrganizationInfo,
  DepartmentListResult,
  RankListResult,
  PositionListResult,
} from '@context/company-context/interfaces/company-context.interface';

/**
 * 공지사항 비즈니스 서비스
 *
 * 공지사항 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 여러 컨텍스트 간 조율
 * - SSO 조직 정보 연동
 */
@Injectable()
export class AnnouncementBusinessService {
  private readonly logger = new Logger(AnnouncementBusinessService.name);

  constructor(
    private readonly announcementContextService: AnnouncementContextService,
    private readonly companyContextService: CompanyContextService,
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * 공지사항 목록을 조회한다
   */
  async 공지사항_목록을_조회한다(params: {
    isPublic?: boolean;
    isFixed?: boolean;
    status?: ContentStatus;
    orderBy?: 'order' | 'createdAt';
    page?: number;
    limit?: number;
  }): Promise<{
    items: Announcement[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('공지사항 목록 조회 시작');

    const result =
      await this.announcementContextService.공지사항_목록을_조회한다(params);

    this.logger.log(`공지사항 목록 조회 완료 - 총 ${result.total}개`);

    return result;
  }

  /**
   * 공지사항 전체 목록을 조회한다 (페이지네이션 없음)
   */
  async 공지사항_전체_목록을_조회한다(): Promise<Announcement[]> {
    this.logger.log('공지사항 전체 목록 조회 시작');

    // 매우 큰 limit을 사용하여 전체 목록 조회
    const result =
      await this.announcementContextService.공지사항_목록을_조회한다({
        limit: 10000,
      });

    this.logger.log(`공지사항 전체 목록 조회 완료 - 총 ${result.total}개`);

    return result.items;
  }

  /**
   * 공지사항을 조회한다
   */
  async 공지사항을_조회한다(id: string): Promise<Announcement> {
    this.logger.log(`공지사항 조회 시작 - ID: ${id}`);

    const announcement =
      await this.announcementContextService.공지사항을_조회한다(id);

    this.logger.log(`공지사항 조회 완료 - ID: ${id}`);

    return announcement;
  }

  /**
   * 공지사항을 생성한다
   */
  async 공지사항을_생성한다(
    data: CreateAnnouncementDto,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 생성 시작 - 제목: ${data.title}`);

    const result =
      await this.announcementContextService.공지사항을_생성한다(data);

    this.logger.log(`공지사항 생성 완료 - ID: ${result.id}`);

    // 생성 후 상세 정보 조회
    return await this.announcementContextService.공지사항을_조회한다(result.id);
  }

  /**
   * 공지사항을 수정한다
   */
  async 공지사항을_수정한다(
    id: string,
    data: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 수정 시작 - ID: ${id}`);

    const result =
      await this.announcementContextService.공지사항을_수정한다(id, data);

    this.logger.log(`공지사항 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항_공개를_수정한다
   */
  async 공지사항_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 공개 상태 수정 시작 - ID: ${id}, 공개: ${isPublic}`);

    const result =
      await this.announcementContextService.공지사항_공개를_수정한다(id, {
        isPublic,
        updatedBy,
      });

    this.logger.log(`공지사항 공개 상태 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항_고정을_수정한다
   */
  async 공지사항_고정을_수정한다(
    id: string,
    isFixed: boolean,
    updatedBy?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 고정 상태 수정 시작 - ID: ${id}, 고정: ${isFixed}`);

    const result =
      await this.announcementContextService.공지사항_고정을_수정한다(id, {
        isFixed,
        updatedBy,
      });

    this.logger.log(`공지사항 고정 상태 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항_오더를_수정한다
   */
  async 공지사항_오더를_수정한다(
    id: string,
    order: number,
    updatedBy?: string,
  ): Promise<Announcement> {
    this.logger.log(`공지사항 오더 수정 시작 - ID: ${id}, Order: ${order}`);

    const result =
      await this.announcementContextService.공지사항_오더를_수정한다(id, {
        order,
        updatedBy,
      });

    this.logger.log(`공지사항 오더 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항 오더를 일괄 수정한다
   */
  async 공지사항_오더를_일괄_수정한다(
    announcements: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `공지사항 일괄 오더 수정 시작 - 수정할 공지사항 수: ${announcements.length}`,
    );

    const result =
      await this.announcementContextService.공지사항_오더를_일괄_수정한다({
        announcements,
        updatedBy,
      });

    this.logger.log(
      `공지사항 일괄 오더 수정 완료 - 수정된 공지사항 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 공지사항을 삭제한다
   */
  async 공지사항을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`공지사항 삭제 시작 - ID: ${id}`);

    const result = await this.announcementContextService.공지사항을_삭제한다(id);

    this.logger.log(`공지사항 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 조직 정보를 가져온다 (SSO)
   */
  async 조직_정보를_가져온다(): Promise<OrganizationInfo> {
    this.logger.log('조직 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.조직_정보를_가져온다();

    this.logger.log('조직 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 부서 정보를 가져온다 (SSO)
   */
  async 부서_정보를_가져온다(): Promise<DepartmentListResult> {
    this.logger.log('부서 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.부서_정보를_가져온다();

    this.logger.log('부서 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 직급 정보를 가져온다 (SSO)
   */
  async 직급_정보를_가져온다(): Promise<RankListResult> {
    this.logger.log('직급 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.직급_정보를_가져온다();

    this.logger.log('직급 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 직책 정보를 가져온다 (SSO)
   */
  async 직책_정보를_가져온다(): Promise<PositionListResult> {
    this.logger.log('직책 정보 조회 시작 (SSO)');

    const result = await this.companyContextService.직책_정보를_가져온다();

    this.logger.log('직책 정보 조회 완료 (SSO)');

    return result;
  }

  /**
   * 공지사항 카테고리 목록을 조회한다
   */
  async 공지사항_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log('공지사항 카테고리 목록 조회 시작');

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.ANNOUNCEMENT,
        false, // 활성화된 것만
      );

    this.logger.log(`공지사항 카테고리 목록 조회 완료 - 총 ${categories.length}개`);

    return categories;
  }

  /**
   * 공지사항 카테고리를 생성한다
   */
  async 공지사항_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`공지사항 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.ANNOUNCEMENT,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`공지사항 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 공지사항 카테고리를 수정한다
   */
  async 공지사항_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`공지사항 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`공지사항 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 공지사항 카테고리 오더를 변경한다
   */
  async 공지사항_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`공지사항 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`공지사항 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 공지사항 카테고리를 삭제한다
   */
  async 공지사항_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`공지사항 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`공지사항 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }
}
