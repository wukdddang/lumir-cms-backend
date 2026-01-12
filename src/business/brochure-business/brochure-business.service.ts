import { Injectable, Logger, Inject } from '@nestjs/common';
import { BrochureContextService } from '@context/brochure-context/brochure-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { BrochureDetailResult } from '@context/brochure-context/interfaces/brochure-context.interface';
import { BrochureListItemDto } from '@interface/common/dto/brochure/brochure-response.dto';

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
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
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
    items: BrochureListItemDto[];
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

    const totalPages = Math.ceil(result.total / limit);

    // Brochure 엔티티를 BrochureListItemDto로 변환 (attachments 제거, translations flatten)
    const items: BrochureListItemDto[] = result.items.map((brochure) => {
      const koreanTranslation = brochure.translations[0]; // 이미 한국어만 필터링되어 있음

      return {
        id: brochure.id,
        isPublic: brochure.isPublic,
        status: brochure.status,
        order: brochure.order,
        title: koreanTranslation?.title || '',
        description: koreanTranslation?.description || null,
        createdAt: brochure.createdAt,
        updatedAt: brochure.updatedAt,
      };
    });

    this.logger.log(
      `브로슈어 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
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
   * 브로슈어 전체 목록을 조회한다 (페이징 없음)
   */
  async 브로슈어_전체_목록을_조회한다(): Promise<BrochureDetailResult[]> {
    this.logger.log('브로슈어 전체 목록 조회 시작');

    const result = await this.brochureContextService.브로슈어_목록을_조회한다(
      undefined,
      'order',
      1,
      1000, // 충분히 큰 숫자
    );

    this.logger.log(`브로슈어 전체 목록 조회 완료 - 총 ${result.items.length}개`);

    return result.items;
  }

  /**
   * 브로슈어를 생성한다 (파일 업로드 포함)
   */
  async 브로슈어를_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    createdBy?: string,
    files?: Express.Multer.File[],
  ): Promise<BrochureDetailResult> {
    this.logger.log(`브로슈어 생성 시작 - 번역 수: ${translations.length}`);

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
        'brochures',
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
      translations,
      attachments:
        attachments && attachments.length > 0 ? attachments : undefined,
      createdBy,
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
   * 기본 브로슈어들을 생성한다
   */
  async 기본_브로슈어들을_생성한다(createdBy?: string): Promise<Brochure[]> {
    this.logger.log(
      `기본 브로슈어 생성 시작 - 생성자: ${createdBy || 'Unknown'}`,
    );

    const result =
      await this.brochureContextService.기본_브로슈어들을_생성한다(createdBy);

    this.logger.log(`기본 브로슈어 생성 완료 - 총 ${result.length}개`);

    return result;
  }

  /**
   * 기본 브로슈어들을 초기화한다 (일괄 제거)
   */
  async 기본_브로슈어들을_초기화한다(): Promise<{
    success: boolean;
    deletedCount: number;
  }> {
    this.logger.log(
      `기본 브로슈어 초기화 시작 (system 사용자 생성 브로슈어 삭제)`,
    );

    const deletedCount =
      await this.brochureContextService.기본_브로슈어들을_초기화한다();

    this.logger.log(`기본 브로슈어 초기화 완료 - 총 ${deletedCount}개 삭제됨`);

    return {
      success: true,
      deletedCount,
    };
  }

  /**
   * 브로슈어 카테고리를 생성한다
   */
  async 브로슈어_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`브로슈어 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.BROCHURE,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`브로슈어 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 브로슈어 카테고리를 수정한다
   */
  async 브로슈어_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`브로슈어 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`브로슈어 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
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

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`브로슈어 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
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
   * 브로슈어 오더를 일괄 수정한다
   */
  async 브로슈어_오더를_일괄_수정한다(
    brochures: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `브로슈어 일괄 오더 수정 시작 - 수정할 브로슈어 수: ${brochures.length}`,
    );

    const result =
      await this.brochureContextService.브로슈어_오더를_일괄_수정한다({
        brochures,
        updatedBy,
      });

    this.logger.log(
      `브로슈어 일괄 오더 수정 완료 - 수정된 브로슈어 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 브로슈어를 수정한다 (번역 및 파일 포함)
   */
  async 브로슈어를_수정한다(
    brochureId: string,
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    updatedBy?: string,
    files?: Express.Multer.File[],
    deleteFileUrls?: string[],
  ): Promise<BrochureTranslation[]> {
    this.logger.log(
      `브로슈어 수정 시작 - 브로슈어 ID: ${brochureId}, 번역 수: ${translations.length}`,
    );

    // 1. 기존 브로슈어 조회
    const brochure =
      await this.brochureContextService.브로슈어_상세_조회한다(brochureId);

    // 2. 파일 삭제 처리
    let remainingAttachments = brochure.attachments || [];
    if (deleteFileUrls && deleteFileUrls.length > 0) {
      this.logger.log(`스토리지에서 ${deleteFileUrls.length}개의 파일 삭제 시작`);
      await this.storageService.deleteFiles(deleteFileUrls);
      this.logger.log(`스토리지 파일 삭제 완료`);

      // 삭제할 파일 제외한 첨부파일 목록 생성
      remainingAttachments = remainingAttachments.filter(
        (attachment) => !deleteFileUrls.includes(attachment.fileUrl),
      );
      this.logger.log(
        `남은 첨부파일: ${remainingAttachments.length}개 (${deleteFileUrls.length}개 삭제됨)`,
      );
    }

    // 3. 새 파일 업로드 처리
    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'brochures',
      );
      const newAttachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));

      // 기존 첨부파일과 새 첨부파일 병합
      remainingAttachments = [...remainingAttachments, ...newAttachments];
      this.logger.log(`파일 업로드 완료: ${newAttachments.length}개`);
    }

    // 4. 파일 정보 업데이트 (파일이 변경된 경우에만)
    if (
      (deleteFileUrls && deleteFileUrls.length > 0) ||
      (files && files.length > 0)
    ) {
      await this.brochureContextService.브로슈어_파일을_수정한다(brochureId, {
        attachments: remainingAttachments,
        updatedBy,
      });
      this.logger.log(`브로슈어 파일 업데이트 완료`);
    }

    // 5. 번역 수정
    const result = await this.brochureContextService.브로슈어_번역들을_수정한다(
      brochureId,
      {
        translations,
        updatedBy,
      },
    );

    this.logger.log(
      `브로슈어 수정 완료 - 브로슈어 ID: ${brochureId}, 수정된 번역 수: ${result.length}`,
    );

    return result;
  }
}
