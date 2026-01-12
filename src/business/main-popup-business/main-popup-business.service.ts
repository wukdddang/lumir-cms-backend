import { Injectable, Logger, Inject } from '@nestjs/common';
import { MainPopupContextService } from '@context/main-popup-context/main-popup-context.service';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { MainPopupListItemDto } from '@interface/common/dto/main-popup/main-popup-response.dto';

/**
 * MainPopup 비즈니스 서비스
 *
 * 메인 팝업 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class MainPopupBusinessService {
  private readonly logger = new Logger(MainPopupBusinessService.name);

  constructor(
    private readonly mainPopupContextService: MainPopupContextService,
    private readonly categoryService: CategoryService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 메인 팝업 전체 목록을 조회한다
   */
  async 메인_팝업_전체_목록을_조회한다(): Promise<MainPopup[]> {
    this.logger.log('메인 팝업 전체 목록 조회 시작');

    const popups =
      await this.mainPopupContextService.메인_팝업_전체_목록을_조회한다();

    this.logger.log(`메인 팝업 전체 목록 조회 완료 - 총 ${popups.length}개`);

    return popups;
  }

  /**
   * 메인 팝업 상세를 조회한다
   */
  async 메인_팝업_상세를_조회한다(id: string): Promise<MainPopup> {
    this.logger.log(`메인 팝업 상세 조회 시작 - ID: ${id}`);

    const popup = await this.mainPopupContextService.메인_팝업_상세를_조회한다(id);

    this.logger.log(`메인 팝업 상세 조회 완료 - ID: ${id}`);

    return popup;
  }

  /**
   * 메인 팝업을 삭제한다
   */
  async 메인_팝업을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`메인 팝업 삭제 시작 - ID: ${id}`);

    const result = await this.mainPopupContextService.메인_팝업을_삭제한다(id);

    this.logger.log(`메인 팝업 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 메인 팝업 공개를 수정한다
   */
  async 메인_팝업_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<MainPopup> {
    this.logger.log(`메인 팝업 공개 수정 시작 - ID: ${id}, 공개: ${isPublic}`);

    const popup = await this.mainPopupContextService.메인_팝업_공개를_수정한다(
      id,
      isPublic,
      updatedBy,
    );

    this.logger.log(`메인 팝업 공개 수정 완료 - ID: ${id}`);

    return popup;
  }

  /**
   * 메인 팝업을 생성한다 (파일 업로드 포함)
   */
  async 메인_팝업을_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    createdBy?: string,
    files?: Express.Multer.File[],
  ): Promise<MainPopup> {
    this.logger.log(`메인 팝업 생성 시작 - 번역 수: ${translations.length}`);

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
        'main-popups',
      );
      attachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${attachments.length}개`);
    }

    // 메인 팝업 생성
    const result = await this.mainPopupContextService.메인_팝업을_생성한다(
      translations,
      createdBy,
      attachments,
    );

    this.logger.log(`메인 팝업 생성 완료 - ID: ${result.id}`);

    return result;
  }

  /**
   * 메인 팝업을 수정한다 (번역 및 파일 포함)
   */
  async 메인_팝업을_수정한다(
    id: string,
    translations: Array<{
      id?: string;
      languageId: string;
      title: string;
      description?: string;
    }>,
    updatedBy?: string,
    files?: Express.Multer.File[],
  ): Promise<MainPopup> {
    this.logger.log(
      `메인 팝업 수정 시작 - ID: ${id}, 번역 수: ${translations.length}`,
    );

    // 1. 기존 메인 팝업 조회
    const popup = await this.mainPopupContextService.메인_팝업_상세를_조회한다(id);

    // 2. 기존 파일 전부 삭제
    const currentAttachments = popup.attachments || [];
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
        'main-popups',
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
    await this.mainPopupContextService.메인_팝업_파일을_수정한다(
      id,
      finalAttachments,
      updatedBy,
    );
    this.logger.log(
      `메인 팝업 파일 업데이트 완료 - 최종 파일 수: ${finalAttachments.length}개`,
    );

    // 5. 번역 수정
    const result = await this.mainPopupContextService.메인_팝업을_수정한다(id, {
      translations,
      updatedBy,
    });

    this.logger.log(`메인 팝업 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 메인 팝업 오더를 일괄 수정한다
   */
  async 메인_팝업_오더를_일괄_수정한다(
    popups: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `메인 팝업 일괄 오더 수정 시작 - 수정할 메인 팝업 수: ${popups.length}`,
    );

    const result =
      await this.mainPopupContextService.메인_팝업_오더를_일괄_수정한다(
        popups,
        updatedBy,
      );

    this.logger.log(
      `메인 팝업 일괄 오더 수정 완료 - 수정된 메인 팝업 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 메인 팝업 목록을 조회한다 (페이징)
   */
  async 메인_팝업_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: MainPopupListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `메인 팝업 목록 조회 시작 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result = await this.mainPopupContextService.메인_팝업_목록을_조회한다(
      isPublic,
      orderBy,
      page,
      limit,
    );

    const totalPages = Math.ceil(result.total / limit);

    // MainPopup 엔티티를 MainPopupListItemDto로 변환
    const items: MainPopupListItemDto[] = result.items.map((popup) => {
      const koreanTranslation =
        popup.translations?.find((t) => t.language?.code === 'ko') ||
        popup.translations?.[0];

      return {
        id: popup.id,
        isPublic: popup.isPublic,
        status: popup.status,
        order: popup.order,
        title: koreanTranslation?.title || '',
        description: koreanTranslation?.description || null,
        createdAt: popup.createdAt,
        updatedAt: popup.updatedAt,
      };
    });

    this.logger.log(
      `메인 팝업 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
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
   * 메인 팝업 카테고리 목록을 조회한다
   */
  async 메인_팝업_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log('메인 팝업 카테고리 목록 조회 시작');

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.MAIN_POPUP,
        true, // 비활성 포함
      );

    this.logger.log(
      `메인 팝업 카테고리 목록 조회 완료 - 총 ${categories.length}개`,
    );

    return categories;
  }

  /**
   * 메인 팝업 카테고리를 생성한다
   */
  async 메인_팝업_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`메인 팝업 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.MAIN_POPUP,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`메인 팝업 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 메인 팝업 카테고리를 수정한다
   */
  async 메인_팝업_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`메인 팝업 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`메인 팝업 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 메인 팝업 카테고리 오더를 변경한다
   */
  async 메인_팝업_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`메인 팝업 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`메인 팝업 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 메인 팝업 카테고리를 삭제한다
   */
  async 메인_팝업_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`메인 팝업 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`메인 팝업 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }
}
