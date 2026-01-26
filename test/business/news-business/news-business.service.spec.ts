import { Test, TestingModule } from '@nestjs/testing';
import { NewsBusinessService } from '@business/news-business/news-business.service';
import { NewsContextService } from '@context/news-context/news-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { News } from '@domain/core/news/news.entity';
import { Category } from '@domain/common/category/category.entity';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';

describe('NewsBusinessService', () => {
  let service: NewsBusinessService;
  let newsContextService: jest.Mocked<NewsContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockNewsContextService = {
    뉴스를_생성한다: jest.fn(),
    뉴스를_수정한다: jest.fn(),
    뉴스를_삭제한다: jest.fn(),
    뉴스_상세_조회한다: jest.fn(),
    뉴스_목록을_조회한다: jest.fn(),
    뉴스_공개를_수정한다: jest.fn(),
    뉴스_오더를_일괄_수정한다: jest.fn(),
    뉴스_파일을_수정한다: jest.fn(),
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
        NewsBusinessService,
        {
          provide: NewsContextService,
          useValue: mockNewsContextService,
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

    service = module.get<NewsBusinessService>(NewsBusinessService);
    newsContextService = module.get(NewsContextService);
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('뉴스_목록을_조회한다', () => {
    it('페이징된 뉴스 목록을 조회해야 한다', async () => {
      // Given
      const mockNews = [
        {
          id: 'news-1',
          title: '뉴스 1',
          description: '설명 1',
          url: 'https://news1.com',
          categoryId: 'cat-1',
          category: { name: '신제품' },
          isPublic: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as News,
        {
          id: 'news-2',
          title: '뉴스 2',
          description: '설명 2',
          url: 'https://news2.com',
          categoryId: 'cat-2',
          category: { name: '수상' },
          isPublic: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as News,
      ];

      const contextResult = {
        items: mockNews,
        total: 2,
        page: 1,
        limit: 10,
      };

      mockNewsContextService.뉴스_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      const result = await service.뉴스_목록을_조회한다(true, 'order', 1, 10);

      // Then
      expect(newsContextService.뉴스_목록을_조회한다).toHaveBeenCalledWith(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
      );
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.items[0].categoryName).toBe('신제품');
      expect(result.items[1].categoryName).toBe('수상');
      expect(result.items.length).toBe(2);
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

      mockNewsContextService.뉴스_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      await service.뉴스_목록을_조회한다(
        true,
        'createdAt',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(newsContextService.뉴스_목록을_조회한다).toHaveBeenCalledWith(
        true,
        'createdAt',
        1,
        10,
        startDate,
        endDate,
      );
    });
  });

  describe('뉴스_전체_목록을_조회한다', () => {
    it('페이징 없이 전체 목록을 조회해야 한다', async () => {
      // Given
      const mockNews = [
        { id: 'news-1', title: '뉴스 1' } as News,
        { id: 'news-2', title: '뉴스 2' } as News,
      ];

      mockNewsContextService.뉴스_목록을_조회한다.mockResolvedValue({
        items: mockNews,
        total: 2,
        page: 1,
        limit: 1000,
      });

      // When
      const result = await service.뉴스_전체_목록을_조회한다();

      // Then
      expect(newsContextService.뉴스_목록을_조회한다).toHaveBeenCalledWith(
        undefined,
        'order',
        1,
        1000,
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('뉴스를_생성한다', () => {
    it('파일 없이 뉴스를 생성해야 한다', async () => {
      // Given
      const title = '루미르 신제품 출시';
      const description = '혁신적인 신제품이 출시되었습니다';
      const url = 'https://news.example.com/lumir';
      const categoryId = 'category-1';
      const createdBy = 'user-1';

      const mockNews = {
        id: 'news-1',
        title,
        description,
        url,
        categoryId,
        isPublic: true,
        order: 0,
      } as News;

      mockNewsContextService.뉴스를_생성한다.mockResolvedValue(mockNews);
      mockNewsContextService.뉴스_상세_조회한다.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스를_생성한다(
        title,
        description,
        url,
        categoryId,
        createdBy,
      );

      // Then
      expect(newsContextService.뉴스를_생성한다).toHaveBeenCalledWith({
        title,
        description,
        url,
        categoryId,
        attachments: undefined,
        createdBy,
      });
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(result).toEqual(mockNews);
    });

    it('파일과 함께 뉴스를 생성해야 한다', async () => {
      // Given
      const title = '뉴스 제목';
      const categoryId = 'category-2';
      const createdBy = 'user-1';
      const files = [
        {
          originalname: 'news.pdf',
          buffer: Buffer.from('test'),
          size: 2048000,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const uploadedFiles = [
        {
          fileName: 'news.pdf',
          url: 'https://s3.aws.com/news.pdf',
          fileSize: 2048000,
          mimeType: 'application/pdf',
        },
      ];

      const mockNews = {
        id: 'news-1',
        title,
        categoryId,
        attachments: [
          {
            fileName: 'news.pdf',
            fileUrl: 'https://s3.aws.com/news.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
      } as News;

      mockStorageService.uploadFiles.mockResolvedValue(uploadedFiles);
      mockNewsContextService.뉴스를_생성한다.mockResolvedValue(mockNews);
      mockNewsContextService.뉴스_상세_조회한다.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스를_생성한다(
        title,
        null,
        null,
        categoryId,
        createdBy,
        files,
      );

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(files, 'news');
      expect(newsContextService.뉴스를_생성한다).toHaveBeenCalledWith({
        title,
        description: null,
        url: null,
        categoryId,
        attachments: [
          {
            fileName: 'news.pdf',
            fileUrl: 'https://s3.aws.com/news.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy,
      });
      expect(result).toEqual(mockNews);
    });
  });

  describe('뉴스_카테고리_목록을_조회한다', () => {
    it('뉴스 카테고리 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        {
          id: 'cat-1',
          name: '카테고리 1',
          entityType: CategoryEntityType.NEWS,
        } as Category,
        {
          id: 'cat-2',
          name: '카테고리 2',
          entityType: CategoryEntityType.NEWS,
        } as Category,
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories,
      );

      // When
      const result = await service.뉴스_카테고리_목록을_조회한다();

      // Then
      expect(
        categoryService.엔티티_타입별_카테고리를_조회한다,
      ).toHaveBeenCalledWith(CategoryEntityType.NEWS, false);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('뉴스_공개를_수정한다', () => {
    it('뉴스 공개 여부를 수정해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const data = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockNews = {
        id: newsId,
        isPublic: false,
      } as News;

      mockNewsContextService.뉴스_공개를_수정한다.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스_공개를_수정한다(newsId, data);

      // Then
      expect(newsContextService.뉴스_공개를_수정한다).toHaveBeenCalledWith(
        newsId,
        data,
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('뉴스_상세_조회한다', () => {
    it('뉴스 상세를 조회해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const mockNews = {
        id: newsId,
        title: '뉴스 1',
        description: '뉴스 설명',
      } as News;

      mockNewsContextService.뉴스_상세_조회한다.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스_상세_조회한다(newsId);

      // Then
      expect(newsContextService.뉴스_상세_조회한다).toHaveBeenCalledWith(
        newsId,
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('뉴스를_삭제한다', () => {
    it('뉴스를 삭제해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      mockNewsContextService.뉴스를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.뉴스를_삭제한다(newsId);

      // Then
      expect(newsContextService.뉴스를_삭제한다).toHaveBeenCalledWith(newsId);
      expect(result).toBe(true);
    });
  });

  describe('뉴스_카테고리를_생성한다', () => {
    it('뉴스 카테고리를 생성해야 한다', async () => {
      // Given
      const data = {
        name: '새 카테고리',
        description: '설명',
        isActive: true,
        order: 0,
        createdBy: 'user-1',
      };

      const mockCategory = {
        id: 'cat-1',
        ...data,
        entityType: CategoryEntityType.NEWS,
      } as Category;

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.뉴스_카테고리를_생성한다(data);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: CategoryEntityType.NEWS,
        name: data.name,
        description: data.description,
        isActive: true,
        order: 0,
        createdBy: data.createdBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('뉴스_카테고리를_수정한다', () => {
    it('뉴스 카테고리를 수정해야 한다', async () => {
      // Given
      const categoryId = 'cat-1';
      const data = {
        name: '수정된 카테고리',
        description: '수정된 설명',
        updatedBy: 'user-1',
      };

      const mockCategory = {
        id: categoryId,
        ...data,
      } as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(
        mockCategory,
      );

      // When
      const result = await service.뉴스_카테고리를_수정한다(categoryId, data);

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(
        categoryId,
        data,
      );
      expect(result).toEqual(mockCategory);
    });
  });

  describe('뉴스_카테고리_오더를_변경한다', () => {
    it('뉴스 카테고리 오더를 변경해야 한다', async () => {
      // Given
      const categoryId = 'cat-1';
      const data = {
        order: 5,
        updatedBy: 'user-1',
      };

      const mockCategory = {
        id: categoryId,
        order: 5,
      } as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(
        mockCategory,
      );

      // When
      const result = await service.뉴스_카테고리_오더를_변경한다(
        categoryId,
        data,
      );

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(
        categoryId,
        {
          order: 5,
          updatedBy: 'user-1',
        },
      );
      expect(result).toEqual(mockCategory);
    });
  });

  describe('뉴스_카테고리를_삭제한다', () => {
    it('뉴스 카테고리를 삭제해야 한다', async () => {
      // Given
      const categoryId = 'cat-1';
      mockCategoryService.카테고리를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.뉴스_카테고리를_삭제한다(categoryId);

      // Then
      expect(categoryService.카테고리를_삭제한다).toHaveBeenCalledWith(
        categoryId,
      );
      expect(result).toBe(true);
    });
  });

  describe('뉴스_오더를_일괄_수정한다', () => {
    it('뉴스 오더를 일괄 수정해야 한다', async () => {
      // Given
      const news = [
        { id: 'news-1', order: 2 },
        { id: 'news-2', order: 1 },
        { id: 'news-3', order: 0 },
      ];
      const updatedBy = 'user-1';

      const mockResult = {
        success: true,
        updatedCount: 3,
      };

      mockNewsContextService.뉴스_오더를_일괄_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.뉴스_오더를_일괄_수정한다(news, updatedBy);

      // Then
      expect(
        newsContextService.뉴스_오더를_일괄_수정한다,
      ).toHaveBeenCalledWith({
        news,
        updatedBy,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('뉴스를_수정한다', () => {
    it('파일 없이 뉴스를 수정해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const title = '수정된 제목';
      const description = '수정된 설명';
      const categoryId = 'category-2';
      const updatedBy = 'user-1';

      const existingNews = {
        id: newsId,
        title: '기존 제목',
        attachments: [],
      } as News;

      const updatedNews = {
        ...existingNews,
        title,
        description,
        categoryId,
      } as News;

      mockNewsContextService.뉴스_상세_조회한다.mockResolvedValue(
        existingNews,
      );
      mockNewsContextService.뉴스_파일을_수정한다.mockResolvedValue(
        existingNews,
      );
      mockNewsContextService.뉴스를_수정한다.mockResolvedValue(updatedNews);

      // When
      const result = await service.뉴스를_수정한다(
        newsId,
        title,
        description,
        null,
        categoryId,
        updatedBy,
      );

      // Then
      expect(newsContextService.뉴스_상세_조회한다).toHaveBeenCalledWith(
        newsId,
      );
      expect(storageService.deleteFiles).not.toHaveBeenCalled();
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(newsContextService.뉴스를_수정한다).toHaveBeenCalledWith(newsId, {
        title,
        description,
        url: null,
        categoryId,
        updatedBy,
      });
      expect(result).toEqual(updatedNews);
    });

    it('기존 파일을 삭제하고 새 파일로 교체해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const title = '수정된 제목';
      const categoryId = 'category-3';
      const updatedBy = 'user-1';
      const newFiles = [
        {
          originalname: 'new-news.pdf',
          buffer: Buffer.from('test'),
          size: 3048000,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const existingNews = {
        id: newsId,
        title: '기존 제목',
        attachments: [
          {
            fileName: 'old-news.pdf',
            fileUrl: 'https://s3.aws.com/old-news.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
      } as News;

      const uploadedFiles = [
        {
          fileName: 'new-news.pdf',
          url: 'https://s3.aws.com/new-news.pdf',
          fileSize: 3048000,
          mimeType: 'application/pdf',
        },
      ];

      const updatedNews = {
        ...existingNews,
        title,
        attachments: [
          {
            fileName: 'new-news.pdf',
            fileUrl: 'https://s3.aws.com/new-news.pdf',
            fileSize: 3048000,
            mimeType: 'application/pdf',
          },
        ],
      } as News;

      mockNewsContextService.뉴스_상세_조회한다.mockResolvedValue(
        existingNews,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(uploadedFiles);
      mockNewsContextService.뉴스_파일을_수정한다.mockResolvedValue(
        updatedNews,
      );
      mockNewsContextService.뉴스를_수정한다.mockResolvedValue(updatedNews);

      // When
      const result = await service.뉴스를_수정한다(
        newsId,
        title,
        null,
        null,
        categoryId,
        updatedBy,
        newFiles,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-news.pdf',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        newFiles,
        'news',
      );
      expect(newsContextService.뉴스_파일을_수정한다).toHaveBeenCalledWith(
        newsId,
        {
          attachments: [
            {
              fileName: 'new-news.pdf',
              fileUrl: 'https://s3.aws.com/new-news.pdf',
              fileSize: 3048000,
              mimeType: 'application/pdf',
            },
          ],
          updatedBy,
        },
      );
      expect(result).toEqual(updatedNews);
    });

    it('기존 파일만 삭제하고 새 파일을 업로드하지 않아야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const title = '수정된 제목';
      const categoryId = 'category-4';
      const updatedBy = 'user-1';

      const existingNews = {
        id: newsId,
        title: '기존 제목',
        attachments: [
          {
            fileName: 'old-news.pdf',
            fileUrl: 'https://s3.aws.com/old-news.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
      } as News;

      const updatedNews = {
        ...existingNews,
        title,
        attachments: [],
      } as News;

      mockNewsContextService.뉴스_상세_조회한다.mockResolvedValue(
        existingNews,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockNewsContextService.뉴스_파일을_수정한다.mockResolvedValue(
        updatedNews,
      );
      mockNewsContextService.뉴스를_수정한다.mockResolvedValue(updatedNews);

      // When
      const result = await service.뉴스를_수정한다(
        newsId,
        title,
        null,
        null,
        categoryId,
        updatedBy,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-news.pdf',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(newsContextService.뉴스_파일을_수정한다).toHaveBeenCalledWith(
        newsId,
        {
          attachments: [],
          updatedBy,
        },
      );
      expect(result).toEqual(updatedNews);
    });
  });
});
