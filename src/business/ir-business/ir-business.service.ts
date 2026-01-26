import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRContextService } from '@context/ir-context/ir-context.service';
import { IR } from '@domain/core/ir/ir.entity';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { IRListItemDto } from '@interface/common/dto/ir/ir-response.dto';

/**
 * IR 비즈니스 서비스
 *
 * IR 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class IRBusinessService {
  private readonly logger = new Logger(IRBusinessService.name);

  constructor(
    private readonly irContextService: IRContextService,
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * IR 전체 목록을 조회한다
   */
  async IR_전체_목록을_조회한다(): Promise<any[]> {
    this.logger.log('IR 전체 목록 조회 시작');

    const irs = await this.irContextService.IR_전체_목록을_조회한다();

    // 모든 IR의 카테고리 매핑 조회
    const irsWithCategories = await Promise.all(
      irs.map(async (ir) => {
        const categories = await this.categoryService.엔티티의_카테고리_매핑을_조회한다(ir.id);
        return {
          ...ir,
          categories,
        };
      })
    );

    this.logger.log(`IR 전체 목록 조회 완료 - 총 ${irs.length}개`);

    return irsWithCategories;
  }

  /**
   * IR 상세를 조회한다
   */
  async IR_상세를_조회한다(id: string): Promise<any> {
    this.logger.log(`IR 상세 조회 시작 - ID: ${id}`);

    const ir = await this.irContextService.IR_상세를_조회한다(id);

    // 카테고리 매핑 조회
    const categories = await this.categoryService.엔티티의_카테고리_매핑을_조회한다(id);

    this.logger.log(`IR 상세 조회 완료 - ID: ${id}`);

    return {
      ...ir,
      categories,
    };
  }

  /**
   * IR을 삭제한다
   */
  async IR을_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`IR 삭제 시작 - ID: ${id}`);

    const result = await this.irContextService.IR을_삭제한다(id);

    this.logger.log(`IR 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * IR 공개를 수정한다
   */
  async IR_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<any> {
    this.logger.log(`IR 공개 수정 시작 - ID: ${id}, 공개: ${isPublic}`);

    const ir = await this.irContextService.IR_공개를_수정한다(
      id,
      isPublic,
      updatedBy,
    );

    // 카테고리 매핑 조회
    const categories = await this.categoryService.엔티티의_카테고리_매핑을_조회한다(id);

    this.logger.log(`IR 공개 수정 완료 - ID: ${id}`);

    return {
      ...ir,
      categories,
    };
  }

  /**
   * IR을 생성한다 (파일 업로드 포함)
   */
  async IR을_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    createdBy: string | undefined,
    files: Express.Multer.File[] | undefined,
    categoryId: string,
  ): Promise<IR> {
    this.logger.log(`IR 생성 시작 - 번역 수: ${translations.length}`);

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
      const uploadedFiles = await this.storageService.uploadFiles(files, 'irs');
      attachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${attachments.length}개`);
    }

    // IR 생성
    const result = await this.irContextService.IR을_생성한다(
      translations,
      createdBy,
      attachments,
      categoryId,
    );

    // 카테고리 매핑 조회
    const categories = await this.categoryService.엔티티의_카테고리_매핑을_조회한다(result.id);

    this.logger.log(`IR 생성 완료 - ID: ${result.id}`);

    return {
      ...result,
      categories,
    } as any;
  }

  /**
   * IR을 수정한다 (번역 및 파일 포함)
   */
  async IR을_수정한다(
    id: string,
    translations: Array<{
      id?: string;
      languageId: string;
      title: string;
      description?: string;
    }>,
    updatedBy: string,
    categoryId: string,
    files?: Express.Multer.File[],
  ): Promise<any> {
    this.logger.log(`IR 수정 시작 - ID: ${id}, 번역 수: ${translations.length}`);

    // 1. 기존 IR 조회
    const ir = await this.irContextService.IR_상세를_조회한다(id);

    // 2. 기존 파일 전부 삭제
    const currentAttachments = ir.attachments || [];
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
      const uploadedFiles = await this.storageService.uploadFiles(files, 'irs');
      finalAttachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${finalAttachments.length}개`);
    }

    // 4. 파일 정보 업데이트
    await this.irContextService.IR_파일을_수정한다(
      id,
      finalAttachments,
      updatedBy,
    );
    this.logger.log(
      `IR 파일 업데이트 완료 - 최종 파일 수: ${finalAttachments.length}개`,
    );

    // 5. categoryId 업데이트
    await this.irContextService.IR을_수정한다(id, {
      categoryId,
      updatedBy,
    });
    this.logger.log(`IR 카테고리 업데이트 완료 - 카테고리 ID: ${categoryId}`);

    // 6. 번역 수정
    const result = await this.irContextService.IR을_수정한다(id, {
      translations,
      updatedBy,
    });

    // 7. 카테고리 매핑 조회
    const categories = await this.categoryService.엔티티의_카테고리_매핑을_조회한다(id);

    this.logger.log(`IR 수정 완료 - ID: ${id}`);

    return {
      ...result,
      categories,
    };
  }

  /**
   * IR 오더를 일괄 수정한다
   */
  async IR_오더를_일괄_수정한다(
    irs: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(`IR 일괄 오더 수정 시작 - 수정할 IR 수: ${irs.length}`);

    const result = await this.irContextService.IR_오더를_일괄_수정한다(
      irs,
      updatedBy,
    );

    this.logger.log(
      `IR 일괄 오더 수정 완료 - 수정된 IR 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * IR 목록을 조회한다 (페이징)
   */
  async IR_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    items: IRListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `IR 목록 조회 시작 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result = await this.irContextService.IR_목록을_조회한다(
      isPublic,
      orderBy,
      page,
      limit,
      startDate,
      endDate,
    );

    const totalPages = Math.ceil(result.total / limit);

    // IR 엔티티를 IRListItemDto로 변환 (카테고리 포함)
    const defaultLanguageCode = this.configService.get<string>('DEFAULT_LANGUAGE_CODE', 'en');
    
    // 모든 IR의 카테고리 매핑 조회
    const irIds = result.items.map(ir => ir.id);
    const categoryPromises = irIds.map(id => 
      this.categoryService.엔티티의_카테고리_매핑을_조회한다(id)
    );
    const categoriesResults = await Promise.all(categoryPromises);
    
    // IR ID별 카테고리 맵 생성
    const categoryMap = new Map<string, any[]>();
    irIds.forEach((id, index) => {
      categoryMap.set(id, categoriesResults[index]);
    });
    
    const items: IRListItemDto[] = result.items.map((ir) => {
      const defaultTranslation =
        ir.translations?.find((t) => t.language?.code === defaultLanguageCode) ||
        ir.translations?.[0];

      return {
        id: ir.id,
        isPublic: ir.isPublic,
        order: ir.order,
        title: defaultTranslation?.title || '',
        description: defaultTranslation?.description || null,
        categoryName: ir.category?.name || '',
        categories: categoryMap.get(ir.id) || [],
        createdAt: ir.createdAt,
        updatedAt: ir.updatedAt,
      };
    });

    this.logger.log(
      `IR 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
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
   * IR 카테고리 목록을 조회한다
   */
  async IR_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log('IR 카테고리 목록 조회 시작');

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.IR,
        true, // 비활성 포함
      );

    this.logger.log(`IR 카테고리 목록 조회 완료 - 총 ${categories.length}개`);

    return categories;
  }

  /**
   * IR 카테고리를 생성한다
   */
  async IR_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`IR 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.IR,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`IR 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * IR 카테고리를 수정한다
   */
  async IR_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`IR 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`IR 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * IR 카테고리 오더를 변경한다
   */
  async IR_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`IR 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`IR 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * IR 카테고리를 삭제한다
   */
  async IR_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`IR 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`IR 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }
}
