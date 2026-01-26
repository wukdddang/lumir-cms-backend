import { Injectable, Logger, Inject } from '@nestjs/common';
import { VideoGalleryContextService } from '@context/video-gallery-context/video-gallery-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { Category } from '@domain/common/category/category.entity';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import type { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { VideoGalleryDetailResult } from '@context/video-gallery-context/interfaces/video-gallery-context.interface';
import { VideoGalleryListItemDto } from '@interface/common/dto/video-gallery/video-gallery-response.dto';

/**
 * 비디오갤러리 비즈니스 서비스
 *
 * 비디오갤러리 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class VideoGalleryBusinessService {
  private readonly logger = new Logger(VideoGalleryBusinessService.name);

  constructor(
    private readonly videoGalleryContextService: VideoGalleryContextService,
    private readonly categoryService: CategoryService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * 비디오갤러리 목록을 조회한다
   */
  async 비디오갤러리_목록을_조회한다(
    isPublic?: boolean,
    orderBy: 'order' | 'createdAt' = 'order',
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    items: VideoGalleryListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `비디오갤러리 목록 조회 시작 - 공개: ${isPublic}, 정렬: ${orderBy}, 페이지: ${page}, 제한: ${limit}`,
    );

    const result = await this.videoGalleryContextService.비디오갤러리_목록을_조회한다(
      isPublic,
      orderBy,
      page,
      limit,
      startDate,
      endDate,
    );

    const totalPages = Math.ceil(result.total / limit);

    // 엔티티를 DTO로 변환
    const items: VideoGalleryListItemDto[] = result.items.map((gallery) => ({
      id: gallery.id,
      title: gallery.title,
      description: gallery.description,
      categoryId: gallery.categoryId,
      categoryName: gallery.category?.name || '',
      category: gallery.category,
      isPublic: gallery.isPublic,
      order: gallery.order,
      createdAt: gallery.createdAt,
      updatedAt: gallery.updatedAt,
    }));

    this.logger.log(
      `비디오갤러리 목록 조회 완료 - 총 ${result.total}개 (${page}/${totalPages} 페이지)`,
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
   * 비디오갤러리 전체 목록을 조회한다 (페이징 없음)
   */
  async 비디오갤러리_전체_목록을_조회한다(): Promise<VideoGalleryDetailResult[]> {
    this.logger.log('비디오갤러리 전체 목록 조회 시작');

    const result = await this.videoGalleryContextService.비디오갤러리_목록을_조회한다(
      undefined,
      'order',
      1,
      1000, // 충분히 큰 숫자
    );

    this.logger.log(
      `비디오갤러리 전체 목록 조회 완료 - 총 ${result.items.length}개`,
    );

    return result.items;
  }

  /**
   * 비디오갤러리를 생성한다 (파일 업로드 + YouTube URL)
   */
  async 비디오갤러리를_생성한다(
    title: string,
    categoryId: string,
    description?: string | null,
    youtubeUrls?: string[],
    createdBy?: string,
    files?: Express.Multer.File[],
  ): Promise<VideoGalleryDetailResult> {
    this.logger.log(`비디오갤러리 생성 시작 - 제목: ${title}`);

    const videoSources: Array<{
      url: string;
      type: 'upload' | 'youtube';
      title?: string;
      thumbnailUrl?: string;
    }> = [];

    // 1. 파일 업로드 처리 → S3 URL 생성
    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 비디오 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'video-galleries',
      );

      uploadedFiles.forEach((file) => {
        videoSources.push({
          url: file.url,
          type: 'upload',
          title: file.fileName,
        });
      });
      this.logger.log(`파일 업로드 완료: ${uploadedFiles.length}개`);
    }

    // 2. YouTube URL 추가
    if (youtubeUrls && youtubeUrls.length > 0) {
      youtubeUrls.forEach((url) => {
        if (url && url.trim()) {
          videoSources.push({
            url: url.trim(),
            type: 'youtube',
          });
        }
      });
      this.logger.log(`YouTube URL 추가: ${youtubeUrls.length}개`);
    }

    // 생성 데이터 구성
    const createData = {
      title,
      categoryId,
      description,
      videoSources: videoSources.length > 0 ? videoSources : undefined,
      createdBy,
    };

    const result = await this.videoGalleryContextService.비디오갤러리를_생성한다(
      createData,
    );

    this.logger.log(
      `비디오갤러리 생성 완료 - ID: ${result.id}, 총 비디오: ${videoSources.length}개`,
    );

    // 상세 정보 조회
    return await this.videoGalleryContextService.비디오갤러리_상세_조회한다(
      result.id,
    );
  }

  /**
   * 비디오갤러리 카테고리 목록을 조회한다
   */
  async 비디오갤러리_카테고리_목록을_조회한다(): Promise<Category[]> {
    this.logger.log(`비디오갤러리 카테고리 목록 조회 시작`);

    const categories =
      await this.categoryService.엔티티_타입별_카테고리를_조회한다(
        CategoryEntityType.VIDEO_GALLERY,
        false, // 활성화된 것만
      );

    this.logger.log(
      `비디오갤러리 카테고리 목록 조회 완료 - 총 ${categories.length}개`,
    );

    return categories;
  }

  /**
   * 비디오갤러리 공개를 수정한다
   */
  async 비디오갤러리_공개를_수정한다(
    id: string,
    data: {
      isPublic: boolean;
      updatedBy?: string;
    },
  ): Promise<VideoGallery> {
    this.logger.log(`비디오갤러리 공개 수정 시작 - ID: ${id}`);

    const result = await this.videoGalleryContextService.비디오갤러리_공개를_수정한다(
      id,
      data,
    );

    this.logger.log(`비디오갤러리 공개 수정 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 비디오갤러리 상세 조회한다
   */
  async 비디오갤러리_상세_조회한다(
    id: string,
  ): Promise<VideoGalleryDetailResult> {
    this.logger.log(`비디오갤러리 상세 조회 시작 - ID: ${id}`);

    const result = await this.videoGalleryContextService.비디오갤러리_상세_조회한다(
      id,
    );

    this.logger.log(`비디오갤러리 상세 조회 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 비디오갤러리를 삭제한다
   */
  async 비디오갤러리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`비디오갤러리 삭제 시작 - ID: ${id}`);

    const result = await this.videoGalleryContextService.비디오갤러리를_삭제한다(
      id,
    );

    this.logger.log(`비디오갤러리 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 비디오갤러리 카테고리를 생성한다
   */
  async 비디오갤러리_카테고리를_생성한다(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    createdBy?: string;
  }): Promise<Category> {
    this.logger.log(`비디오갤러리 카테고리 생성 시작 - 이름: ${data.name}`);

    const newCategory = await this.categoryService.카테고리를_생성한다({
      entityType: CategoryEntityType.VIDEO_GALLERY,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    });

    this.logger.log(`비디오갤러리 카테고리 생성 완료 - ID: ${newCategory.id}`);

    return newCategory;
  }

  /**
   * 비디오갤러리 카테고리를 수정한다
   */
  async 비디오갤러리_카테고리를_수정한다(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`비디오갤러리 카테고리 수정 시작 - ID: ${id}`);

    const updatedCategory = await this.categoryService.카테고리를_업데이트한다(
      id,
      data,
    );

    this.logger.log(`비디오갤러리 카테고리 수정 완료 - ID: ${id}`);

    return updatedCategory;
  }

  /**
   * 비디오갤러리 카테고리 오더를 변경한다
   */
  async 비디오갤러리_카테고리_오더를_변경한다(
    id: string,
    data: {
      order: number;
      updatedBy?: string;
    },
  ): Promise<Category> {
    this.logger.log(`비디오갤러리 카테고리 오더 변경 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_업데이트한다(id, {
      order: data.order,
      updatedBy: data.updatedBy,
    });

    this.logger.log(`비디오갤러리 카테고리 오더 변경 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 비디오갤러리 카테고리를 삭제한다
   */
  async 비디오갤러리_카테고리를_삭제한다(id: string): Promise<boolean> {
    this.logger.log(`비디오갤러리 카테고리 삭제 시작 - ID: ${id}`);

    const result = await this.categoryService.카테고리를_삭제한다(id);

    this.logger.log(`비디오갤러리 카테고리 삭제 완료 - ID: ${id}`);

    return result;
  }

  /**
   * 비디오갤러리 오더를 일괄 수정한다
   */
  async 비디오갤러리_오더를_일괄_수정한다(
    videoGalleries: Array<{ id: string; order: number }>,
    updatedBy?: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `비디오갤러리 일괄 오더 수정 시작 - 수정할 비디오갤러리 수: ${videoGalleries.length}`,
    );

    const result =
      await this.videoGalleryContextService.비디오갤러리_오더를_일괄_수정한다({
        videoGalleries,
        updatedBy,
      });

    this.logger.log(
      `비디오갤러리 일괄 오더 수정 완료 - 수정된 비디오갤러리 수: ${result.updatedCount}`,
    );

    return result;
  }

  /**
   * 비디오갤러리를 수정한다 (파일 업로드 + YouTube URL)
   */
  async 비디오갤러리를_수정한다(
    videoGalleryId: string,
    title: string,
    updatedBy: string,
    categoryId: string,
    description?: string | null,
    youtubeUrls?: string[],
    files?: Express.Multer.File[],
  ): Promise<VideoGallery> {
    this.logger.log(`비디오갤러리 수정 시작 - 비디오갤러리 ID: ${videoGalleryId}`);

    // 1. 기존 비디오갤러리 조회
    const videoGallery =
      await this.videoGalleryContextService.비디오갤러리_상세_조회한다(
        videoGalleryId,
      );

    // 2. 기존 업로드 파일 전부 삭제 (S3에서만 삭제, YouTube URL은 유지 안 함)
    const currentVideoSources = videoGallery.videoSources || [];
    const uploadedVideos = currentVideoSources.filter(
      (source) => source.type === 'upload',
    );

    if (uploadedVideos.length > 0) {
      const filesToDelete = uploadedVideos.map((video) => video.url);
      this.logger.log(
        `스토리지에서 기존 ${filesToDelete.length}개의 파일 삭제 시작`,
      );
      await this.storageService.deleteFiles(filesToDelete);
      this.logger.log(`스토리지 파일 삭제 완료`);
    }

    // 3. 새로운 비디오 소스 배열 구성
    const newVideoSources: Array<{
      url: string;
      type: 'upload' | 'youtube';
      title?: string;
      thumbnailUrl?: string;
    }> = [];

    // 3-1. 새 파일 업로드 처리 → S3 URL 생성
    if (files && files.length > 0) {
      this.logger.log(`${files.length}개의 비디오 파일 업로드 시작`);
      const uploadedFiles = await this.storageService.uploadFiles(
        files,
        'video-galleries',
      );

      uploadedFiles.forEach((file) => {
        newVideoSources.push({
          url: file.url,
          type: 'upload',
          title: file.fileName,
        });
      });
      this.logger.log(`파일 업로드 완료: ${uploadedFiles.length}개`);
    }

    // 3-2. YouTube URL 추가
    if (youtubeUrls && youtubeUrls.length > 0) {
      youtubeUrls.forEach((url) => {
        if (url && url.trim()) {
          newVideoSources.push({
            url: url.trim(),
            type: 'youtube',
          });
        }
      });
      this.logger.log(`YouTube URL 추가: ${youtubeUrls.length}개`);
    }

    // 4. 비디오 소스 업데이트
    await this.videoGalleryContextService.비디오갤러리_파일을_수정한다(
      videoGalleryId,
      {
        videoSources: newVideoSources,
        updatedBy,
      },
    );
    this.logger.log(
      `비디오갤러리 비디오 소스 업데이트 완료 - 총 비디오: ${newVideoSources.length}개`,
    );

    // 5. 내용 수정
    const result = await this.videoGalleryContextService.비디오갤러리를_수정한다(
      videoGalleryId,
      {
        title,
        categoryId,
        description,
        updatedBy,
      },
    );

    this.logger.log(`비디오갤러리 수정 완료 - 비디오갤러리 ID: ${videoGalleryId}`);

    return result;
  }
}
