import { Injectable, Logger, Inject } from '@nestjs/common';
import { ElectronicDisclosureContextService } from '@context/electronic-disclosure-context/electronic-disclosure-context.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { ElectronicDisclosureListItemDto } from '@interface/common/dto/electronic-disclosure/electronic-disclosure-response.dto';

/**
 * 전자공시 비즈니스 서비스
 *
 * 전자공시 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class ElectronicDisclosureBusinessService {
  private readonly logger = new Logger(ElectronicDisclosureBusinessService.name);

  constructor(
    private readonly electronicDisclosureContextService: ElectronicDisclosureContextService,
    private readonly categoryService: CategoryService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 전자공시 전체 목록을 조회한다
   */
  async 전자공시_전체_목록을_조회한다(): Promise<ElectronicDisclosure[]> {
    this.logger.log('전자공시 전체 목록 조회 시작');

    const disclosures =
      await this.electronicDisclosureContextService.전자공시_전체_목록을_조회한다();

    this.logger.log(`전자공시 전체 목록 조회 완료 - 총 ${disclosures.length}개`);

    return disclosures;
  }

  /**
   * 전자공시 상세를 조회한다
   */
  async 전자공시_상세를_조회한다(id: string): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 상세 조회 시작 - ID: ${id}`);

    const disclosure =
      await this.electronicDisclosureContextService.전자공시_상세를_조회한다(id);

    this.logger.log(`전자공시 상세 조회 완료 - ID: ${id}`);

    return disclosure;
  }

  /**
   * 전자공시를 삭제한다
   */
  async 전자공시를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`전자공시 삭제 시작 - ID: ${id}`);

    const result =
      await this.electronicDisclosureContextService.전자공시를_삭제한다(id);

    this.logger.log(`전자공시 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시 공개를 수정한다
   */
  async 전자공시_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 공개 수정 시작 - ID: ${id}, 공개: ${isPublic}`);

    const disclosure =
      await this.electronicDisclosureContextService.전자공시_공개를_수정한다(
        id,
        isPublic,
        updatedBy,
      );

    this.logger.log(`전자공시 공개 수정 완료 - ID: ${id}`);

    return disclosure;
  }

  /**
   * 전자공시 파일을 수정한다 (파일 업로드 포함)
   */
  async 전자공시_파일을_수정한다(
    id: string,
    data: {
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }>;
      updatedBy?: string;
    },
    files?: Express.Multer.File[],
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 파일 수정 시작 - ID: ${id}`);

    // 파일 업로드 처리
    let attachments = data.attachments;
    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'electronic-disclosures',
      );
      const newAttachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));

      // 기존 첨부파일과 새 첨부파일 병합
      attachments = [...(attachments || []), ...newAttachments];
      this.logger.log(`파일 업로드 완료: ${newAttachments.length}개`);
    }

    const result =
      await this.electronicDisclosureContextService.전자공시_파일을_수정한다(
        id,
        attachments || [],
        data.updatedBy,
      );

    this.logger.log(`전자공시 파일 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시 파일을 삭제한다
   */
  async 전자공시_파일을_삭제한다(
    id: string,
    fileUrls: string[],
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(
      `전자공시 파일 삭제 시작 - ID: ${id}, 파일 수: ${fileUrls.length}`,
    );

    // 전자공시 조회
    const disclosure =
      await this.electronicDisclosureContextService.전자공시_상세를_조회한다(id);

    if (!disclosure.attachments || disclosure.attachments.length === 0) {
      this.logger.warn(`삭제할 파일이 없습니다 - ID: ${id}`);
      return disclosure;
    }

    // 스토리지에서 파일 삭제
    this.logger.log(`스토리지에서 ${fileUrls.length}개의 파일 삭제 시작`);
    await this.storageService.deleteFiles(fileUrls);
    this.logger.log(`스토리지 파일 삭제 완료`);

    // 삭제할 파일 제외한 첨부파일 목록 생성
    const remainingAttachments = disclosure.attachments.filter(
      (attachment) => !fileUrls.includes(attachment.fileUrl),
    );

    this.logger.log(
      `남은 첨부파일: ${remainingAttachments.length}개 (${disclosure.attachments.length - remainingAttachments.length}개 삭제됨)`,
    );

    // 전자공시 파일 정보 업데이트
    const result =
      await this.electronicDisclosureContextService.전자공시_파일을_수정한다(
        id,
        remainingAttachments,
        updatedBy,
      );

    this.logger.log(`전자공시 파일 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시를 생성한다 (파일 업로드 포함)
   */
  async 전자공시를_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    createdBy?: string,
    files?: Express.Multer.File[],
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 생성 시작 - 번역 수: ${translations.length}`);

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
        'electronic-disclosures',
      );
      attachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${attachments.length}개`);
    }

    // 전자공시 생성
    const result =
      await this.electronicDisclosureContextService.전자공시를_생성한다(
        translations,
        createdBy,
        attachments,
      );

    this.logger.log(`전자공시 생성 완료 - ID: ${result.id}`);

    return result;
  }

  /**
   * 전자공시를 수정한다
   */
  async 전자공시를_수정한다(
    id: string,
    data: {
      isPublic?: boolean;
      status?: string;
      order?: number;
      translations?: Array<{
        id?: string;
        languageId: string;
        title: string;
        description?: string;
      }>;
      updatedBy?: string;
    },
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 수정 시작 - ID: ${id}`);

    const result = await this.electronicDisclosureContextService.전자공시를_수정한다(
      id,
      data,
    );

    this.logger.log(`전자공시 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시 오더를 수정한다
   */
  async 전자공시_오더를_수정한다(
    id: string,
    order: number,
    updatedBy?: string,
  ): Promise<ElectronicDisclosure> {
    this.logger.log(`전자공시 오더 수정 시작 - ID: ${id}, 오더: ${order}`);

    const result =
      await this.electronicDisclosureContextService.전자공시_오더를_수정한다(
        id,
        order,
        updatedBy,
      );

    this.logger.log(`전자공시 오더 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시 목록을 조회한다 (페이징)
   */
  async 전자공시_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: ElectronicDisclosureListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `전자공시 목록 조회 시작 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result =
      await this.electronicDisclosureContextService.전자공시_목록을_조회한다(
        isPublic,
        orderBy,
        page,
        limit,
      );

    const totalPages = Math.ceil(result.total / limit);

    // ElectronicDisclosure 엔티티를 ElectronicDisclosureListItemDto로 변환
    const items: ElectronicDisclosureListItemDto[] = result.items.map(
      (disclosure) => {
        const koreanTranslation = disclosure.translations?.find(
          (t) => t.language?.code === 'ko'
        ) || disclosure.translations?.[0];

        return {
          id: disclosure.id,
          isPublic: disclosure.isPublic,
          status: disclosure.status,
          order: disclosure.order,
          title: koreanTranslation?.title || '',
          description: koreanTranslation?.description || null,
          createdAt: disclosure.createdAt,
          updatedAt: disclosure.updatedAt,
        };
      },
    );

    this.logger.log(
      `전자공시 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
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
   * 전자공시 카테고리 목록을 조회한다
   */
  async 전자공시_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log('전자공시 카테고리 목록 조회 시작');

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.ELECTRONIC_DISCLOSURE,
        true, // 비활성 포함
      );

    this.logger.log(
      `전자공시 카테고리 목록 조회 완료 - 총 ${categories.length}개`,
    );

    return categories;
  }

  /**
   * 전자공시 카테고리를 생성한다
   */
  async 전자공시_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`전자공시 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.ELECTRONIC_DISCLOSURE,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`전자공시 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 전자공시 카테고리를 수정한다
   */
  async 전자공시_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`전자공시 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`전자공시 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 전자공시 카테고리 오더를 변경한다
   */
  async 전자공시_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`전자공시 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`전자공시 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 전자공시 카테고리를 삭제한다
   */
  async 전자공시_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`전자공시 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`전자공시 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }
}
