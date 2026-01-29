import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareholdersMeetingContextService } from '@context/shareholders-meeting-context/shareholders-meeting-context.service';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { VoteResultType } from '@domain/core/shareholders-meeting/vote-result-type.types';

/**
 * 주주총회 비즈니스 서비스
 *
 * 주주총회 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class ShareholdersMeetingBusinessService {
  private readonly logger = new Logger(ShareholdersMeetingBusinessService.name);

  constructor(
    private readonly shareholdersMeetingContextService: ShareholdersMeetingContextService,
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 주주총회 전체 목록을 조회한다
   */
  async 주주총회_전체_목록을_조회한다(): Promise<ShareholdersMeeting[]> {
    this.logger.log('주주총회 전체 목록 조회 시작');

    const meetings =
      await this.shareholdersMeetingContextService.주주총회_전체_목록을_조회한다();

    this.logger.log(`주주총회 전체 목록 조회 완료 - 총 ${meetings.length}개`);

    return meetings;
  }

  /**
   * 주주총회 상세를 조회한다
   */
  async 주주총회_상세를_조회한다(id: string): Promise<any> {
    this.logger.log(`주주총회 상세 조회 시작 - ID: ${id}`);

    const meeting =
      await this.shareholdersMeetingContextService.주주총회_상세를_조회한다(id);

    this.logger.log(`주주총회 상세 조회 완료 - ID: ${id}`);

    // category 객체는 제거하고 categoryName만 반환
    const { category, ...meetingData } = meeting as any;

    return {
      ...meetingData,
      categoryName: category?.name,
    };
  }

  /**
   * 주주총회를 삭제한다
   */
  async 주주총회를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`주주총회 삭제 시작 - ID: ${id}`);

    const result =
      await this.shareholdersMeetingContextService.주주총회를_삭제한다(id);

    this.logger.log(`주주총회 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 주주총회 공개를 수정한다
   */
  async 주주총회_공개를_수정한다(
    id: string,
    isPublic: boolean,
    updatedBy?: string,
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 공개 수정 시작 - ID: ${id}, 공개: ${isPublic}`);

    const meeting =
      await this.shareholdersMeetingContextService.주주총회_공개를_수정한다(
        id,
        isPublic,
        updatedBy,
      );

    this.logger.log(`주주총회 공개 수정 완료 - ID: ${id}`);

    return meeting;
  }

  /**
   * 주주총회를 생성한다 (파일 업로드 포함)
   */
  async 주주총회를_생성한다(
    translations: Array<{
      languageId: string;
      title: string;
      description?: string;
    }>,
    meetingData: {
      categoryId: string | null;
      location: string;
      meetingDate: Date;
    },
    voteResults?: Array<{
      agendaNumber: number;
      totalVote: number;
      yesVote: number;
      noVote: number;
      approvalRating: number;
      result: VoteResultType;
      translations: Array<{
        languageId: string;
        title: string;
      }>;
    }>,
    createdBy?: string,
    files?: Express.Multer.File[],
  ): Promise<ShareholdersMeeting> {
    this.logger.log(`주주총회 생성 시작 - 번역 수: ${translations.length}`);

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
        'shareholders-meetings',
      );
      attachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }));
      this.logger.log(`파일 업로드 완료: ${attachments.length}개`);
    }

    // 주주총회 생성
    const result =
      await this.shareholdersMeetingContextService.주주총회를_생성한다(
        translations,
        meetingData,
        voteResults,
        createdBy,
        attachments,
      );

    this.logger.log(`주주총회 생성 완료 - ID: ${result.id}`);

    return result;
  }

  /**
   * 주주총회를 수정한다 (번역 및 파일 포함)
   */
  async 주주총회를_수정한다(
    id: string,
    translations: Array<{
      id?: string;
      languageId: string;
      title: string;
      description?: string;
    }>,
    updatedBy: string,
    categoryId: string | null,
    meetingData?: {
      location?: string;
      meetingDate?: Date;
    },
    voteResults?: Array<{
      id?: string;
      agendaNumber: number;
      totalVote: number;
      yesVote: number;
      noVote: number;
      approvalRating: number;
      result: VoteResultType;
      translations: Array<{
        id?: string;
        languageId: string;
        title: string;
      }>;
    }>,
    files?: Express.Multer.File[],
  ): Promise<ShareholdersMeeting> {
    this.logger.log(
      `주주총회 수정 시작 - ID: ${id}, 번역 수: ${translations?.length || 0}`,
    );

    // 1. 기존 주주총회 조회
    const meeting =
      await this.shareholdersMeetingContextService.주주총회_상세를_조회한다(id);

    // 2. 기존 파일에 deletedAt 설정 (소프트 삭제)
    const currentAttachments = meeting.attachments || [];
    const markedForDeletion = currentAttachments.map((att: any) => ({
      ...att,
      deletedAt: new Date(),
    }));
    this.logger.log(
      `기존 ${currentAttachments.length}개의 파일을 소프트 삭제로 표시`,
    );

    // 3. 새 파일 업로드 처리
    let finalAttachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      deletedAt?: Date | null;
    }> = [];

    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'shareholders-meetings',
      );
      finalAttachments = uploadedFiles.map((file) => ({
        fileName: file.fileName,
        fileUrl: file.url,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        deletedAt: null,
      }));
      this.logger.log(`파일 업로드 완료: ${finalAttachments.length}개`);
    } else {
      // files가 없으면 기존 파일만 소프트 삭제된 상태로 유지
      finalAttachments = markedForDeletion;
    }

    // 4. 파일 정보 업데이트
    await this.shareholdersMeetingContextService.주주총회_파일을_수정한다(
      id,
      finalAttachments,
      updatedBy,
    );
    this.logger.log(
      `주주총회 파일 업데이트 완료 - 최종 파일 수: ${finalAttachments.length}개`,
    );

    // 5. 주주총회 정보 및 번역 수정
    const result =
      await this.shareholdersMeetingContextService.주주총회를_수정한다(id, {
        categoryId,
        ...meetingData,
        translations,
        voteResults,
        updatedBy,
      });

    this.logger.log(`주주총회 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 주주총회 오더를 일괄 수정한다
   */
  async 주주총회_오더를_일괄_수정한다(
    shareholdersMeetings: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `주주총회 일괄 오더 수정 시작 - 수정할 주주총회 수: ${shareholdersMeetings.length}`,
    );

    const result =
      await this.shareholdersMeetingContextService.주주총회_오더를_일괄_수정한다(
        shareholdersMeetings,
        updatedBy,
      );

    this.logger.log(
      `주주총회 일괄 오더 수정 완료 - 수정된 주주총회 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 주주총회 목록을 조회한다 (페이징)
   */
  async 주주총회_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'meetingDate' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
    categoryId?: string,
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `주주총회 목록 조회 시작 - 공개: ${isPublic}, 카테고리: ${categoryId}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result =
      await this.shareholdersMeetingContextService.주주총회_목록을_조회한다(
        isPublic,
        orderBy,
        page,
        limit,
        startDate,
        endDate,
        categoryId,
      );

    const totalPages = Math.ceil(result.total / limit);

    // ShareholdersMeeting 엔티티를 DTO로 변환
    const defaultLanguageCode = this.configService.get<string>(
      'DEFAULT_LANGUAGE_CODE',
      'en',
    );
    const items = result.items.map((meeting) => {
      const defaultTranslation =
        meeting.translations?.find(
          (t: any) => t.language?.code === defaultLanguageCode,
        ) || meeting.translations?.[0];

      return {
        id: meeting.id,
        categoryId: meeting.categoryId,
        categoryName: meeting.category?.name || null,
        isPublic: meeting.isPublic,
        order: meeting.order,
        location: meeting.location,
        meetingDate: meeting.meetingDate,
        title: defaultTranslation?.title || '',
        description: defaultTranslation?.description || null,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
      };
    });

    this.logger.log(
      `주주총회 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
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
   * 주주총회 카테고리 목록을 조회한다
   */
  async 주주총회_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log('주주총회 카테고리 목록 조회 시작');

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.SHAREHOLDERS_MEETING,
        true, // 비활성 포함
      );

    this.logger.log(
      `주주총회 카테고리 목록 조회 완료 - 총 ${categories.length}개`,
    );

    return categories;
  }

  /**
   * 주주총회 카테고리를 생성한다
   */
  async 주주총회_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`주주총회 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.SHAREHOLDERS_MEETING,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`주주총회 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 주주총회 카테고리를 수정한다
   */
  async 주주총회_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`주주총회 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`주주총회 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 주주총회 카테고리 오더를 변경한다
   */
  async 주주총회_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`주주총회 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`주주총회 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 주주총회 카테고리를 삭제한다
   */
  async 주주총회_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`주주총회 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`주주총회 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }
}
