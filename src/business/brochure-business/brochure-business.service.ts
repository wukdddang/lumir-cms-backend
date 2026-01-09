import { Injectable, Logger } from '@nestjs/common';
import { BrochureContextService } from '@context/brochure-context/brochure-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { Category } from '@domain/common/category/category.entity';
import { ContentStatus } from '@domain/core/content-status.types';
import { BrochureDetailResult } from '@context/brochure-context/interfaces/brochure-context.interface';

/**
 * 브로슈어 비즈니스 서비스
 *
 * 브로슈어 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class BrochureBusinessService {
  private readonly logger = new Logger(BrochureBusinessService.name);

  constructor(
    private readonly brochureContextService: BrochureContextService,
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * 브로슈어 목록을 조회한다
   */
  async 브로슈어_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: Brochure[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `브로슈어 목록 조회 시작 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result = await this.brochureContextService.브로슈어_목록을_조회한다(
      isPublic,
      orderBy,
      page,
      limit,
    );

    const totalPages = Math.ceil(result.total / result.limit);

    this.logger.log(`브로슈어 목록 조회 완료 - 총 ${result.total}개`);

    return {
      ...result,
      totalPages,
    };
  }

  /**
   * 브로슈어를 생성한다
   */
  async 브로슈어를_생성한다(data: {
    isPublic?: boolean;
    status?: ContentStatus;
    translations: Array<{
      languageId: string;
      title: string;
      description?: string | null;
    }>;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }> | null;
    order?: number;
    createdBy?: string;
  }): Promise<BrochureDetailResult> {
    this.logger.log(
      `브로슈어 생성 시작 - 제목: ${data.translations[0]?.title}`,
    );

    // 기본값 설정
    const createData = {
      isPublic: data.isPublic ?? true,
      status: data.status ?? ContentStatus.DRAFT,
      order: data.order ?? 0,
      translations: data.translations.map((t) => ({
        languageId: t.languageId,
        title: t.title,
        description: t.description ?? undefined, // null을 undefined로 변환
      })),
      attachments: data.attachments || undefined,
      createdBy: data.createdBy,
    };

    const result =
      await this.brochureContextService.브로슈어를_생성한다(createData);

    this.logger.log(`브로슈어 생성 완료 - ID: ${result.id}`);

    // 상세 정보 조회
    return await this.brochureContextService.브로슈어_상세_조회한다(result.id);
  }

  /**
   * 브로슈어 카테고리 목록을 조회한다
   */
  async 브로슈어_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log(`브로슈어 카테고리 목록 조회 시작`);

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.BROCHURE,
        false, // 활성화된 것만
      );

    this.logger.log(
      `브로슈어 카테고리 목록 조회 완료 - 총 ${categories.length}개`,
    );

    return categories;
  }

  /**
   * 브로슈어 공개를 수정한다
   */
  async 브로슈어_공개를_수정한다(
    id: string,
    data: {
      isPublic: boolean;
      updatedBy?: string;
    },
  ): Promise<Brochure> {
    this.logger.log(`브로슈어 공개 수정 시작 - ID: ${id}`);

    const result = await this.brochureContextService.브로슈어_공개를_수정한다(
      id,
      data,
    );

    this.logger.log(`브로슈어 공개 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 브로슈어 상세 조회한다
   */
  async 브로슈어_상세_조회한다(id: string): Promise<BrochureDetailResult> {
    this.logger.log(`브로슈어 상세 조회 시작 - ID: ${id}`);

    const result = await this.brochureContextService.브로슈어_상세_조회한다(id);

    this.logger.log(`브로슈어 상세 조회 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 브로슈어를 삭제한다
   */
  async 브로슈어를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`브로슈어 삭제 시작 - ID: ${id}`);

    const result = await this.brochureContextService.브로슈어를_삭제한다(id);

    this.logger.log(`브로슈어 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 브로슈어 오더를 수정한다
   */
  async 브로슈어_오더를_수정한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Brochure> {
    this.logger.log(`브로슈어 오더 수정 시작 - ID: ${id}`);

    const result = await this.brochureContextService.브로슈어_오더를_수정한다(
      id,
      data,
    );

    this.logger.log(`브로슈어 오더 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 브로슈어 카테고리를 수정한다
   */
  async 브로슈어_카테고리를_수정한다(
    id: string,
    data: {
      categoryIds: string[];
      updatedBy?: string;
    },
  ): Promise<boolean> {
    this.logger.log(`브로슈어 카테고리 수정 시작 - ID: ${id}`);

    // TODO: 카테고리 관련 로직 구현 필요
    // Category Context Service와 통합 필요

    this.logger.log(`브로슈어 카테고리 수정 완료 - ID: ${id}`);

    return true;
  }

  /**
   * 브로슈어 카테고리를 생성한다
   */
  async 브로슈어_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`브로슈어 카테고리 생성 시작 - 이름: ${data.name}`);

    const category = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.BROCHURE,
      name: data.name,
      description: data.description,
      isActive: true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`브로슈어 카테고리 생성 완료 - ID: ${category.id}`);

    return category;
  }

  /**
   * 브로슈어 카테고리 오더를 변경한다
   */
  async 브로슈어_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`브로슈어 카테고리 오더 변경 시작 - ID: ${id}`);

    const category = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`브로슈어 카테고리 오더 변경 완료 - ID: ${id}`);

    return category;
  }

  /**
   * 브로슈어 카테고리를 삭제한다
   */
  async 브로슈어_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`브로슈어 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`브로슈어 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 브로슈어 파일을 수정한다
   */
  async 브로슈어_파일을_수정한다(
    id: string,
    data: {
      attachments: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }>;
      updatedBy?: string;
    },
  ): Promise<Brochure> {
    this.logger.log(`브로슈어 파일 수정 시작 - ID: ${id}`);

    const result = await this.brochureContextService.브로슈어_파일을_수정한다(
      id,
      data,
    );

    this.logger.log(`브로슈어 파일 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 기본 브로슈어들을 추가한다
   */
  async 기본_브로슈어들을_추가한다(createdBy?: string): Promise<Brochure[]> {
    this.logger.log('기본 브로슈어 추가 시작');

    const result =
      await this.brochureContextService.기본_브로슈어들을_추가한다(createdBy);

    this.logger.log(`기본 브로슈어 추가 완료 - 총 ${result.length}개 추가됨`);

    return result;
  }
}
