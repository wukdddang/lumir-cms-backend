import { Test, TestingModule } from '@nestjs/testing';
import { LumirStoryBusinessService } from '@business/lumir-story-business/lumir-story-business.service';
import { LumirStoryContextService } from '@context/lumir-story-context/lumir-story-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { Category } from '@domain/common/category/category.entity';

describe('LumirStoryBusinessService', () => {
  let service: LumirStoryBusinessService;
  let lumirStoryContextService: jest.Mocked<LumirStoryContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockLumirStoryContextService = {
    루미르스토리를_생성한다: jest.fn(),
    루미르스토리를_수정한다: jest.fn(),
    루미르스토리를_삭제한다: jest.fn(),
    루미르스토리_상세_조회한다: jest.fn(),
    루미르스토리_목록을_조회한다: jest.fn(),
    루미르스토리_공개를_수정한다: jest.fn(),
    루미르스토리_오더를_일괄_수정한다: jest.fn(),
    루미르스토리_파일을_수정한다: jest.fn(),
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
        LumirStoryBusinessService,
        {
          provide: LumirStoryContextService,
          useValue: mockLumirStoryContextService,
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

    service = module.get<LumirStoryBusinessService>(LumirStoryBusinessService);
    lumirStoryContextService = module.get(LumirStoryContextService);
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('루미르스토리_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          {
            id: 'lumir-story-1',
            title: '루미르 스토리 1',
            isPublic: true,
            order: 0,
          } as LumirStory,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLumirStoryContextService.루미르스토리_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.루미르스토리_목록을_조회한다(
        true,
        'order',
        1,
        10,
      );

      // Then
      expect(
        lumirStoryContextService.루미르스토리_목록을_조회한다,
      ).toHaveBeenCalledWith(true, 'order', 1, 10, undefined, undefined);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('루미르 스토리 1');
    });

    it('날짜 필터를 포함하여 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockLumirStoryContextService.루미르스토리_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.루미르스토리_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(
        lumirStoryContextService.루미르스토리_목록을_조회한다,
      ).toHaveBeenCalledWith(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );
      expect(result.total).toBe(0);
    });

    it('totalPages를 계산해야 한다', async () => {
      // Given
      const mockResult = {
        items: [],
        total: 25,
        page: 1,
        limit: 10,
      };

      mockLumirStoryContextService.루미르스토리_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.루미르스토리_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
      );

      // Then
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('루미르스토리_전체_목록을_조회한다', () => {
    it('limit을 1000으로 설정하여 전체 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          { id: 'lumir-story-1' } as LumirStory,
          { id: 'lumir-story-2' } as LumirStory,
        ],
        total: 2,
        page: 1,
        limit: 1000,
      };

      mockLumirStoryContextService.루미르스토리_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.루미르스토리_전체_목록을_조회한다();

      // Then
      expect(
        lumirStoryContextService.루미르스토리_목록을_조회한다,
      ).toHaveBeenCalledWith(undefined, 'order', 1, 1000);
      expect(result).toEqual(mockResult.items);
    });
  });

  describe('루미르스토리를_생성한다', () => {
    it('파일 없이 루미르스토리를 생성해야 한다', async () => {
      // Given
      const title = '루미르 스토리 제목';
      const content = '루미르 스토리 내용';
      const categoryId = 'category-1';
      const createdBy = 'user-1';

      const mockCreateResult = {
        id: 'lumir-story-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      const mockDetailResult = {
        id: 'lumir-story-1',
        title,
        content,
        categoryId,
        isPublic: true,
        order: 0,
      } as any;

      mockLumirStoryContextService.루미르스토리를_생성한다.mockResolvedValue(
        mockCreateResult,
      );
      mockLumirStoryContextService.루미르스토리_상세_조회한다.mockResolvedValue(
        mockDetailResult,
      );

      // When
      const result = await service.루미르스토리를_생성한다(
        title,
        content,
        categoryId,
        undefined,
        createdBy,
      );

      // Then
      expect(
        lumirStoryContextService.루미르스토리를_생성한다,
      ).toHaveBeenCalledWith({
        title,
        content,
        categoryId,
        imageUrl: undefined,
        attachments: undefined,
        createdBy,
      });
      expect(
        lumirStoryContextService.루미르스토리_상세_조회한다,
      ).toHaveBeenCalledWith('lumir-story-1');
      expect(result).toEqual(mockDetailResult);
    });

    it('파일과 함께 루미르스토리를 생성해야 한다', async () => {
      // Given
      const title = '루미르 스토리 제목';
      const content = '루미르 스토리 내용';
      const categoryId = 'category-1';
      const createdBy = 'user-1';
      const files = [
        {
          originalname: 'story.pdf',
          buffer: Buffer.from('test'),
          size: 1024,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockUploadedFiles = [
        {
          fileName: 'story.pdf',
          url: 'https://s3.aws.com/story.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      ];

      const mockCreateResult = {
        id: 'lumir-story-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      const mockDetailResult = {
        id: 'lumir-story-1',
        title,
        content,
        categoryId,
        isPublic: true,
        order: 0,
        attachments: mockUploadedFiles,
      } as any;

      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockLumirStoryContextService.루미르스토리를_생성한다.mockResolvedValue(
        mockCreateResult,
      );
      mockLumirStoryContextService.루미르스토리_상세_조회한다.mockResolvedValue(
        mockDetailResult,
      );

      // When
      const result = await service.루미르스토리를_생성한다(
        title,
        content,
        categoryId,
        undefined,
        createdBy,
        files,
      );

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'lumir-stories',
      );
      expect(
        lumirStoryContextService.루미르스토리를_생성한다,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          content,
          categoryId,
          attachments: expect.arrayContaining([
            expect.objectContaining({
              fileName: 'story.pdf',
              fileUrl: 'https://s3.aws.com/story.pdf',
            }),
          ]),
          createdBy,
        }),
      );
      expect(result.attachments).toEqual(mockUploadedFiles);
    });
  });

  describe('루미르스토리_카테고리_목록을_조회한다', () => {
    it('카테고리 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        {
          id: 'category-1',
          name: '회사 소개',
          entityType: 'lumir_story',
        },
        {
          id: 'category-2',
          name: '제품 소개',
          entityType: 'lumir_story',
        },
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories as any,
      );

      // When
      const result = await service.루미르스토리_카테고리_목록을_조회한다();

      // Then
      expect(
        categoryService.엔티티_타입별_카테고리를_조회한다,
      ).toHaveBeenCalledWith('lumir_story', false);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('루미르스토리_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태를 수정해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const updateDto = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: lumirStoryId,
        isPublic: false,
      } as any as LumirStory;

      mockLumirStoryContextService.루미르스토리_공개를_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.루미르스토리_공개를_수정한다(
        lumirStoryId,
        updateDto,
      );

      // Then
      expect(
        lumirStoryContextService.루미르스토리_공개를_수정한다,
      ).toHaveBeenCalledWith(lumirStoryId, updateDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리_상세_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 상세 정보를 조회해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const mockLumirStory = {
        id: lumirStoryId,
        title: '루미르 스토리',
        content: '내용',
        isPublic: true,
      } as any;

      mockLumirStoryContextService.루미르스토리_상세_조회한다.mockResolvedValue(
        mockLumirStory,
      );

      // When
      const result = await service.루미르스토리_상세_조회한다(lumirStoryId);

      // Then
      expect(
        lumirStoryContextService.루미르스토리_상세_조회한다,
      ).toHaveBeenCalledWith(lumirStoryId);
      expect(result).toEqual(mockLumirStory);
    });
  });

  describe('루미르스토리를_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 루미르스토리를 삭제해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      mockLumirStoryContextService.루미르스토리를_삭제한다.mockResolvedValue(
        true,
      );

      // When
      const result = await service.루미르스토리를_삭제한다(lumirStoryId);

      // Then
      expect(
        lumirStoryContextService.루미르스토리를_삭제한다,
      ).toHaveBeenCalledWith(lumirStoryId);
      expect(result).toBe(true);
    });
  });

  describe('루미르스토리_카테고리를_생성한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '신제품',
        description: '신제품 카테고리',
        isActive: true,
        order: 5,
        createdBy: 'user-1',
      };

      const mockCategory = {
        id: 'category-1',
        ...createDto,
        entityType: 'lumir_story',
      } as Category;

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.루미르스토리_카테고리를_생성한다(createDto);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: 'lumir_story',
        name: createDto.name,
        description: createDto.description,
        isActive: createDto.isActive,
        order: createDto.order,
        createdBy: createDto.createdBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('루미르스토리_오더를_일괄_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 순서를 일괄 수정해야 한다', async () => {
      // Given
      const lumirStories = [
        { id: 'lumir-story-1', order: 0 },
        { id: 'lumir-story-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = { success: true, updatedCount: 2 };
      mockLumirStoryContextService.루미르스토리_오더를_일괄_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.루미르스토리_오더를_일괄_수정한다(
        lumirStories,
        updatedBy,
      );

      // Then
      expect(
        lumirStoryContextService.루미르스토리_오더를_일괄_수정한다,
      ).toHaveBeenCalledWith({
        lumirStories,
        updatedBy,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리를_수정한다', () => {
    it('파일을 포함하여 루미르스토리를 수정해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const title = '수정된 제목';
      const content = '수정된 내용';
      const categoryId = 'category-2';
      const updatedBy = 'user-1';
      const files = [
        {
          originalname: 'new-story.pdf',
          buffer: Buffer.from('test'),
          size: 2048,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockExistingLumirStory = {
        id: lumirStoryId,
        attachments: [
          {
            fileName: 'old-story.pdf',
            fileUrl: 'https://s3.aws.com/old-story.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUploadedFiles = [
        {
          fileName: 'new-story.pdf',
          url: 'https://s3.aws.com/new-story.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      ];

      const mockUpdatedLumirStory = {
        id: lumirStoryId,
        title,
        content,
        categoryId,
      } as LumirStory;

      mockLumirStoryContextService.루미르스토리_상세_조회한다.mockResolvedValue(
        mockExistingLumirStory,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockLumirStoryContextService.루미르스토리_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockLumirStoryContextService.루미르스토리를_수정한다.mockResolvedValue(
        mockUpdatedLumirStory,
      );

      // When
      const result = await service.루미르스토리를_수정한다(
        lumirStoryId,
        title,
        content,
        updatedBy,
        categoryId,
        undefined,
        files,
      );

      // Then
      expect(
        lumirStoryContextService.루미르스토리_상세_조회한다,
      ).toHaveBeenCalledWith(lumirStoryId);
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-story.pdf',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'lumir-stories',
      );
      expect(
        lumirStoryContextService.루미르스토리_파일을_수정한다,
      ).toHaveBeenCalledWith(
        lumirStoryId,
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              fileName: 'new-story.pdf',
            }),
          ]),
          updatedBy,
        }),
      );
      expect(
        lumirStoryContextService.루미르스토리를_수정한다,
      ).toHaveBeenCalledWith(lumirStoryId, {
        title,
        content,
        categoryId,
        imageUrl: undefined,
        updatedBy,
      });
      expect(result).toEqual(mockUpdatedLumirStory);
    });

    it('파일 없이 루미르스토리를 수정해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const title = '수정된 제목';
      const content = '수정된 내용';
      const categoryId = 'category-2';
      const updatedBy = 'user-1';

      const mockExistingLumirStory = {
        id: lumirStoryId,
        attachments: [
          {
            fileName: 'old-story.pdf',
            fileUrl: 'https://s3.aws.com/old-story.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUpdatedLumirStory = {
        id: lumirStoryId,
        title,
        content,
        categoryId,
      } as LumirStory;

      mockLumirStoryContextService.루미르스토리_상세_조회한다.mockResolvedValue(
        mockExistingLumirStory,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockLumirStoryContextService.루미르스토리_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockLumirStoryContextService.루미르스토리를_수정한다.mockResolvedValue(
        mockUpdatedLumirStory,
      );

      // When
      const result = await service.루미르스토리를_수정한다(
        lumirStoryId,
        title,
        content,
        updatedBy,
        categoryId,
        undefined,
        undefined,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-story.pdf',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(
        lumirStoryContextService.루미르스토리_파일을_수정한다,
      ).toHaveBeenCalledWith(
        lumirStoryId,
        expect.objectContaining({
          attachments: [],
          updatedBy,
        }),
      );
      expect(result).toEqual(mockUpdatedLumirStory);
    });
  });
});
