import { Injectable, Logger, Inject } from '@nestjs/common';
import { NewsContextService } from '@context/news-context/news-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { News } from '@domain/core/news/news.entity';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { NewsDetailResult } from '@context/news-context/interfaces/news-context.interface';
import { NewsListItemDto } from '@interface/common/dto/news/news-response.dto';

/**
 * 뉴스 비즈니스 서비스
 *
 * 뉴스 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class NewsBusinessService {
  private readonly logger = new Logger(NewsBusinessService.name);

  constructor(
    private readonly newsContextService: NewsContextService,
    private readonly categoryService: CategoryService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 뉴스 목록을 조회한다
   */
  async 뉴스_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    items: NewsListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `뉴스 목록 조회 시작 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result = await this.newsContextService.뉴스_목록을_조회한다(
      isPublic,
      orderBy,
      page,
      limit,
      startDate,
      endDate,
    );

    const totalPages = Math.ceil(result.total / limit);

    // 엔티티를 DTO로 변환
    const items: NewsListItemDto[] = result.items.map((news) => ({
      id: news.id,
      title: news.title,
      description: news.description,
      url: news.url,
      categoryId: news.categoryId,
      categoryName: news.category?.name || '',
      isPublic: news.isPublic,
      order: news.order,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
    }));

    this.logger.log(
      `뉴스 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
    );

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages,
    };
  }

  /**
   * 뉴스 전체 목록을 조회한다 (페이징 없음)
   */
  async 뉴스_전체_목록을_조회한다(): Promise<NewsDetailResult[]> {
    this.logger.log('뉴스 전체 목록 조회 시작');

    const result = await this.newsContextService.뉴스_목록을_조회한다(
      undefined,
      'order',
      1,
      1000, // 충분히 큰 숫자
    );

    this.logger.log(`뉴스 전체 목록 조회 완료 - 총 ${result.items.length}개`);

    return result.items;
  }

  /**
   * 뉴스를 생성한다 (파일 업로드 포함)
   */
  async 뉴스를_생성한다(
    title: string,
    description: string | null,
    url: string | null,
    categoryId: string,
    createdBy?: string,
    files?: Express.Multer.File[],
  ): Promise<NewsDetailResult> {
    this.logger.log(`뉴스 생성 시작 - 제목: ${title}`);

    // 파일 업로드 처리
    let attachments:
      | Array<{
          fileName: string;
          fileUrl: string;
          fileSize: number;
          mimeType: string;
        }>
      | undefined = undefined;

    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'news',
      );
      attachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${attachments.length}개`);
    }

    // 생성 데이터 구성
    const createData = {
      title,
      description,
      url,
      categoryId,
      attachments:
        attachments && attachments.length > 0 ? attachments : undefined,
      createdBy,
    };

    const result = await this.newsContextService.뉴스를_생성한다(createData);

    this.logger.log(`뉴스 생성 완료 - ID: ${result.id}`);

    // 상세 정보 조회
    return await this.newsContextService.뉴스_상세_조회한다(result.id);
  }

  /**
   * 뉴스 카테고리 목록을 조회한다
   */
  async 뉴스_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log(`뉴스 카테고리 목록 조회 시작`);

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.NEWS,
        false, // 활성화된 것만
      );

    this.logger.log(`뉴스 카테고리 목록 조회 완료 - 총 ${categories.length}개`);

    return categories;
  }

  /**
   * 뉴스 공개를 수정한다
   */
  async 뉴스_공개를_수정한다(
    id: string,
    data: {
      isPublic: boolean;
      updatedBy?: string;
    },
  ): Promise<News> {
    this.logger.log(`뉴스 공개 수정 시작 - ID: ${id}`);

    const result = await this.newsContextService.뉴스_공개를_수정한다(id, data);

    this.logger.log(`뉴스 공개 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 뉴스 상세 조회한다
   */
  async 뉴스_상세_조회한다(id: string): Promise<NewsDetailResult> {
    this.logger.log(`뉴스 상세 조회 시작 - ID: ${id}`);

    const result = await this.newsContextService.뉴스_상세_조회한다(id);

    this.logger.log(`뉴스 상세 조회 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 뉴스를 삭제한다
   */
  async 뉴스를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`뉴스 삭제 시작 - ID: ${id}`);

    const result = await this.newsContextService.뉴스를_삭제한다(id);

    this.logger.log(`뉴스 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 뉴스 카테고리를 생성한다
   */
  async 뉴스_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`뉴스 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.NEWS,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`뉴스 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 뉴스 카테고리를 수정한다
   */
  async 뉴스_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`뉴스 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`뉴스 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 뉴스 카테고리 오더를 변경한다
   */
  async 뉴스_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`뉴스 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`뉴스 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 뉴스 카테고리를 삭제한다
   */
  async 뉴스_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`뉴스 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`뉴스 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 뉴스 오더를 일괄 수정한다
   */
  async 뉴스_오더를_일괄_수정한다(
    news: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(`뉴스 일괄 오더 수정 시작 - 수정할 뉴스 수: ${news.length}`);

    const result = await this.newsContextService.뉴스_오더를_일괄_수정한다({
      news,
      updatedBy,
    });

    this.logger.log(
      `뉴스 일괄 오더 수정 완료 - 수정된 뉴스 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 뉴스를 수정한다 (파일 포함)
   */
  async 뉴스를_수정한다(
    newsId: string,
    title: string,
    description: string | null,
    url: string | null,
    categoryId: string,
    updatedBy?: string,
    files?: Express.Multer.File[],
  ): Promise<News> {
    this.logger.log(`뉴스 수정 시작 - 뉴스 ID: ${newsId}`);

    // 1. 기존 뉴스 조회
    const news = await this.newsContextService.뉴스_상세_조회한다(newsId);

    // 2. 기존 파일 전부 삭제
    const currentAttachments = news.attachments || [];
    if (currentAttachments.length > 0) {
      const filesToDelete = currentAttachments.map((att) => att.fileUrl);
      this.logger.log(
        `스토리지에서 기존 ${filesToDelete.length}개의 파일 삭제 시작`,
      );
      await this.storageService.deleteFiles(filesToDelete);
      this.logger.log(`스토리지 파일 삭제 완료`);
    }

    // 3. 새 파일 업로드 처리
    let finalAttachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }> = [];

    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'news',
      );
      finalAttachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${finalAttachments.length}개`);
    }

    // 4. 파일 정보 업데이트
    await this.newsContextService.뉴스_파일을_수정한다(newsId, {
      attachments: finalAttachments,
      updatedBy,
    });
    this.logger.log(
      `뉴스 파일 업데이트 완료 - 최종 파일 수: ${finalAttachments.length}개`,
    );

    // 5. 내용 수정
    const result = await this.newsContextService.뉴스를_수정한다(newsId, {
      title,
      description,
      url,
      categoryId,
      updatedBy,
    });

    this.logger.log(`뉴스 수정 완료 - 뉴스 ID: ${newsId}`);

    return result;
  }
}
