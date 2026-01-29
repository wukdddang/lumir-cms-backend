import { Test, TestingModule } from '@nestjs/testing';
import { VideoGalleryBusinessService } from '@business/video-gallery-business/video-gallery-business.service';
import { VideoGalleryContextService } from '@context/video-gallery-context/video-gallery-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { Category } from '@domain/common/category/category.entity';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';

describe('VideoGalleryBusinessService', () => {
  let service: VideoGalleryBusinessService;
  let videoGalleryContextService: jest.Mocked<VideoGalleryContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockVideoGalleryContextService = {
    비디오갤러리를_생성한다: jest.fn(),
    비디오갤러리를_수정한다: jest.fn(),
    비디오갤러리를_삭제한다: jest.fn(),
    비디오갤러리_상세_조회한다: jest.fn(),
    비디오갤러리_목록을_조회한다: jest.fn(),
    비디오갤러리_공개를_수정한다: jest.fn(),
    비디오갤러리_오더를_일괄_수정한다: jest.fn(),
    비디오갤러리_파일을_수정한다: jest.fn(),
  };

  const mockCategoryService = {
    엔티티_타입별_카테고리를_조회한다: jest.fn(),
    카테고리를_생성한다: jest.fn(),
    카테고리를_업데이트한다: jest.fn(),
    카테고리를_삭제한다: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    uploadFiles: jest.fn(),
    deleteFile: jest.fn(),
    deleteFiles: jest.fn(),
    getFileUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoGalleryBusinessService,
        {
          provide: VideoGalleryContextService,
          useValue: mockVideoGalleryContextService,
        },
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: STORAGE_SERVICE,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<VideoGalleryBusinessService>(
      VideoGalleryBusinessService,
    );
    videoGalleryContextService = module.get(VideoGalleryContextService);
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('비디오갤러리_목록을_조회한다', () => {
    it('페이징된 비디오갤러리 목록을 조회해야 한다', async () => {
      // Given
      const mockVideoGalleries = [
        {
          id: 'gallery-1',
          title: '비디오갤러리 1',
          description: '설명 1',
          categoryId: 'cat-1',
          category: { name: '홍보' },
          isPublic: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as VideoGallery,
        {
          id: 'gallery-2',
          title: '비디오갤러리 2',
          description: '설명 2',
          categoryId: 'cat-2',
          category: { name: '교육' },
          isPublic: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as VideoGallery,
      ];

      const contextResult = {
        items: mockVideoGalleries,
        total: 2,
        page: 1,
        limit: 10,
      };

      mockVideoGalleryContextService.비디오갤러리_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      const result = await service.비디오갤러리_목록을_조회한다(
        true,
        'order',
        1,
        10,
      );

      // Then
      expect(
        videoGalleryContextService.비디오갤러리_목록을_조회한다,
      ).toHaveBeenCalledWith(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
        undefined,
      );
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.items[0].categoryName).toBe('홍보');
      expect(result.items[1].categoryName).toBe('교육');
      expect(result.items.length).toBe(2);
    });

    it('카테고리 ID로 필터링하여 조회해야 한다', async () => {
      // Given
      const categoryId = 'cat-1';
      const mockVideoGalleries = [
        {
          id: 'gallery-1',
          title: '비디오갤러리 1',
          description: '설명 1',
          categoryId: 'cat-1',
          category: { name: '홍보' },
          isPublic: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as VideoGallery,
      ];

      const contextResult = {
        items: mockVideoGalleries,
        total: 1,
        page: 1,
        limit: 10,
      };

      mockVideoGalleryContextService.비디오갤러리_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      const result = await service.비디오갤러리_목록을_조회한다(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
        categoryId,
      );

      // Then
      expect(
        videoGalleryContextService.비디오갤러리_목록을_조회한다,
      ).toHaveBeenCalledWith(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
        categoryId,
      );
      expect(result.items[0].categoryId).toBe('cat-1');
      expect(result.items[0].categoryName).toBe('홍보');
      expect(result.total).toBe(1);
    });

    it('날짜 범위로 필터링하여 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const contextResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockVideoGalleryContextService.비디오갤러리_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      await service.비디오갤러리_목록을_조회한다(
        true,
        'createdAt',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(
        videoGalleryContextService.비디오갤러리_목록을_조회한다,
      ).toHaveBeenCalledWith(
        true,
        'createdAt',
        1,
        10,
        startDate,
        endDate,
        undefined,
      );
    });
  });
});
