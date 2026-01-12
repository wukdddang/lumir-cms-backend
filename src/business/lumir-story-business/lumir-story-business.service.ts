import { Injectable, Logger, Inject } from '@nestjs/common';
import { LumirStoryContextService } from '@context/lumir-story-context/lumir-story-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { LumirStoryDetailResult } from '@context/lumir-story-context/interfaces/lumir-story-context.interface';

/**
 * 루미르스토리 비즈니스 서비스
 *
 * 루미르스토리 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class LumirStoryBusinessService {
  private readonly logger = new Logger(LumirStoryBusinessService.name);

  constructor(
    private readonly lumirStoryContextService: LumirStoryContextService,
    private readonly categoryService: CategoryService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 루미르스토리 목록을 조회한다
   */
  async 루미르스토리_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: LumirStory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `루미르스토리 목록 조회 시작 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result = await this.lumirStoryContextService.루미르스토리_목록을_조회한다(
      isPublic,
      orderBy,
      page,
      limit,
    );

    const totalPages = Math.ceil(result.total / limit);

    this.logger.log(
      `루미르스토리 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
    );

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages,
    };
  }

  /**
   * 루미르스토리 전체 목록을 조회한다 (페이징 없음)
   */
  async 루미르스토리_전체_목록을_조회한다(): Promise<LumirStoryDetailResult[]> {
    this.logger.log('루미르스토리 전체 목록 조회 시작');

    const result = await this.lumirStoryContextService.루미르스토리_목록을_조회한다(
      undefined,
      'order',
      1,
      1000, // 충분히 큰 숫자
    );

    this.logger.log(
      `루미르스토리 전체 목록 조회 완료 - 총 ${result.items.length}개`,
    );

    return result.items;
  }

  /**
   * 루미르스토리를 생성한다 (파일 업로드 포함)
   */
  async 루미르스토리를_생성한다(
    title: string,
    content: string,
    imageUrl?: string | null,
    createdBy?: string,
    files?: Express.Multer.File[],
  ): Promise<LumirStoryDetailResult> {
    this.logger.log(`루미르스토리 생성 시작 - 제목: ${title}`);

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
        'lumir-stories',
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
      content,
      imageUrl,
      attachments:
        attachments && attachments.length > 0 ? attachments : undefined,
      createdBy,
    };

    const result = await this.lumirStoryContextService.루미르스토리를_생성한다(
      createData,
    );

    this.logger.log(`루미르스토리 생성 완료 - ID: ${result.id}`);

    // 상세 정보 조회
    return await this.lumirStoryContextService.루미르스토리_상세_조회한다(
      result.id,
    );
  }

  /**
   * 루미르스토리 카테고리 목록을 조회한다
   */
  async 루미르스토리_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log(`루미르스토리 카테고리 목록 조회 시작`);

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.LUMIR_STORY,
        false, // 활성화된 것만
      );

    this.logger.log(
      `루미르스토리 카테고리 목록 조회 완료 - 총 ${categories.length}개`,
    );

    return categories;
  }

  /**
   * 루미르스토리 공개를 수정한다
   */
  async 루미르스토리_공개를_수정한다(
    id: string,
    data: {
      isPublic: boolean;
      updatedBy?: string;
    },
  ): Promise<LumirStory> {
    this.logger.log(`루미르스토리 공개 수정 시작 - ID: ${id}`);

    const result = await this.lumirStoryContextService.루미르스토리_공개를_수정한다(
      id,
      data,
    );

    this.logger.log(`루미르스토리 공개 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 루미르스토리 상세 조회한다
   */
  async 루미르스토리_상세_조회한다(
    id: string,
  ): Promise<LumirStoryDetailResult> {
    this.logger.log(`루미르스토리 상세 조회 시작 - ID: ${id}`);

    const result = await this.lumirStoryContextService.루미르스토리_상세_조회한다(
      id,
    );

    this.logger.log(`루미르스토리 상세 조회 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 루미르스토리를 삭제한다
   */
  async 루미르스토리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`루미르스토리 삭제 시작 - ID: ${id}`);

    const result = await this.lumirStoryContextService.루미르스토리를_삭제한다(
      id,
    );

    this.logger.log(`루미르스토리 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 루미르스토리 카테고리를 생성한다
   */
  async 루미르스토리_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`루미르스토리 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.LUMIR_STORY,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`루미르스토리 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 루미르스토리 카테고리를 수정한다
   */
  async 루미르스토리_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`루미르스토리 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`루미르스토리 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 루미르스토리 카테고리 오더를 변경한다
   */
  async 루미르스토리_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`루미르스토리 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`루미르스토리 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 루미르스토리 카테고리를 삭제한다
   */
  async 루미르스토리_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`루미르스토리 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`루미르스토리 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 루미르스토리 오더를 일괄 수정한다
   */
  async 루미르스토리_오더를_일괄_수정한다(
    lumirStories: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `루미르스토리 일괄 오더 수정 시작 - 수정할 루미르스토리 수: ${lumirStories.length}`,
    );

    const result =
      await this.lumirStoryContextService.루미르스토리_오더를_일괄_수정한다({
        lumirStories,
        updatedBy,
      });

    this.logger.log(
      `루미르스토리 일괄 오더 수정 완료 - 수정된 루미르스토리 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 루미르스토리를 수정한다 (파일 포함)
   */
  async 루미르스토리를_수정한다(
    lumirStoryId: string,
    title: string,
    content: string,
    imageUrl?: string | null,
    updatedBy?: string,
    files?: Express.Multer.File[],
  ): Promise<LumirStory> {
    this.logger.log(`루미르스토리 수정 시작 - 루미르스토리 ID: ${lumirStoryId}`);

    // 1. 기존 루미르스토리 조회
    const lumirStory =
      await this.lumirStoryContextService.루미르스토리_상세_조회한다(
        lumirStoryId,
      );

    // 2. 기존 파일 전부 삭제
    const currentAttachments = lumirStory.attachments || [];
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
        'lumir-stories',
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
    await this.lumirStoryContextService.루미르스토리_파일을_수정한다(
      lumirStoryId,
      {
        attachments: finalAttachments,
        updatedBy,
      },
    );
    this.logger.log(
      `루미르스토리 파일 업데이트 완료 - 최종 파일 수: ${finalAttachments.length}개`,
    );

    // 5. 내용 수정
    const result = await this.lumirStoryContextService.루미르스토리를_수정한다(
      lumirStoryId,
      {
        title,
        content,
        imageUrl,
        updatedBy,
      },
    );

    this.logger.log(`루미르스토리 수정 완료 - 루미르스토리 ID: ${lumirStoryId}`);

    return result;
  }
}
