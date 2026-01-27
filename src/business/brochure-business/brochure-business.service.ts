import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
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
    startDate?: Date,
    endDate?: Date,
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
      startDate,
      endDate,
    );

    const totalPages = Math.ceil(result.total / limit);

    // Brochure 엔티티를 BrochureListItemDto로 변환 (attachments 제거, translations flatten)
    const items: BrochureListItemDto[] = result.items.map((brochure) => {
      const koreanTranslation = brochure.translations[0]; // 이미 한국어만 필터링되어 있음

      return {
        id: brochure.id,
        isPublic: brochure.isPublic,
        order: brochure.order,
        title: koreanTranslation?.title || '',
        description: koreanTranslation?.description || null,
        categoryName: brochure.category?.name || '',
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
    categoryId: string | null,
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
      categoryId,
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
  ): Promise<BrochureDetailResult> {
    this.logger.log(`브로슈어 공개 수정 시작 - ID: ${id}`);

    await this.brochureContextService.브로슈어_공개를_수정한다(
      id,
      data,
    );

    this.logger.log(`브로슈어 공개 수정 완료 - ID: ${id}`);

    // 상세 정보 조회하여 categoryName 포함하여 반환
    return await this.brochureContextService.브로슈어_상세_조회한다(id);
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
  async 기본_브로슈어들을_생성한다(createdBy?: string): Promise<BrochureDetailResult[]> {
    this.logger.log(
      `기본 브로슈어 생성 시작 - 생성자: ${createdBy || 'Unknown'}`,
    );

    const brochures =
      await this.brochureContextService.기본_브로슈어들을_생성한다(createdBy);

    this.logger.log(`기본 브로슈어 생성 완료 - 총 ${brochures.length}개`);

    // 각 브로슈어의 상세 정보 조회하여 categoryName 포함
    const results = await Promise.all(
      brochures.map(brochure => this.brochureContextService.브로슈어_상세_조회한다(brochure.id))
    );

    return results;
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
   * 브로슈어 카테고리 엔티티를 수정한다
   */
  async 브로슈어_카테고리_엔티티를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`브로슈어 카테고리 엔티티 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`브로슈어 카테고리 엔티티 수정 완료 - ID: ${id}`);

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
    updatedBy: string,
    categoryId: string | null,
    files?: Express.Multer.File[],
  ): Promise<BrochureTranslation[]> {
    if (!translations || translations.length === 0) {
      throw new BadRequestException('translations는 비어있지 않은 배열이어야 합니다.');
    }

    this.logger.log(
      `브로슈어 수정 시작 - 브로슈어 ID: ${brochureId}, 번역 수: ${translations.length}`,
    );

    // 1. 기존 브로슈어 조회
    const brochure =
      await this.brochureContextService.브로슈어_상세_조회한다(brochureId);

    // 2. 기존 파일 전부 삭제
    const currentAttachments = brochure.attachments || [];
    if (currentAttachments.length > 0) {
      const filesToDelete = currentAttachments.map((att) => att.fileUrl);
      this.logger.log(`스토리지에서 기존 ${filesToDelete.length}개의 파일 삭제 시작`);
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
        'brochures',
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
    await this.brochureContextService.브로슈어_파일을_수정한다(brochureId, {
      attachments: finalAttachments,
      updatedBy,
    });
    this.logger.log(
      `브로슈어 파일 업데이트 완료 - 최종 파일 수: ${finalAttachments.length}개`,
    );

    // 5. categoryId 업데이트
    await this.brochureContextService.브로슈어를_수정한다(brochureId, {
      categoryId,
      updatedBy,
    });
    this.logger.log(`브로슈어 카테고리 업데이트 완료 - 카테고리 ID: ${categoryId}`);

    // 6. 번역 수정
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
