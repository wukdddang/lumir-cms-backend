import { Test, TestingModule } from '@nestjs/testing';
import { BrochureBusinessService } from '@business/brochure-business/brochure-business.service';
import { BrochureContextService } from '@context/brochure-context/brochure-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { Category } from '@domain/common/category/category.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';

describe('BrochureBusinessService', () => {
  let service: BrochureBusinessService;
  let brochureContextService: jest.Mocked<BrochureContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockBrochureContextService = {
    브로슈어를_생성한다: jest.fn(),
    브로슈어를_수정한다: jest.fn(),
    브로슈어를_삭제한다: jest.fn(),
    브로슈어_상세_조회한다: jest.fn(),
    브로슈어_목록을_조회한다: jest.fn(),
    브로슈어_공개를_수정한다: jest.fn(),
    브로슈어_오더를_일괄_수정한다: jest.fn(),
    브로슈어_파일을_수정한다: jest.fn(),
    브로슈어_번역들을_수정한다: jest.fn(),
    기본_브로슈어들을_생성한다: jest.fn(),
    기본_브로슈어들을_초기화한다: jest.fn(),
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
        BrochureBusinessService,
        {
          provide: BrochureContextService,
          useValue: mockBrochureContextService,
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

    service = module.get<BrochureBusinessService>(BrochureBusinessService);
    brochureContextService = module.get(BrochureContextService);
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('브로슈어_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          {
            id: 'brochure-1',
            isPublic: true,
            order: 0,
            translations: [
              {
                title: '회사 소개',
                description: '설명',
                language: { code: 'ko' },
              },
            ],
          } as any,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockBrochureContextService.브로슈어_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.브로슈어_목록을_조회한다(
        true,
        'order',
        1,
        10,
      );

      // Then
      expect(brochureContextService.브로슈어_목록을_조회한다).toHaveBeenCalledWith(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('회사 소개');
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

      mockBrochureContextService.브로슈어_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.브로슈어_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(brochureContextService.브로슈어_목록을_조회한다).toHaveBeenCalledWith(
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

      mockBrochureContextService.브로슈어_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.브로슈어_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
      );

      // Then
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('브로슈어_전체_목록을_조회한다', () => {
    it('limit을 1000으로 설정하여 전체 목록을 조회해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          { id: 'brochure-1' } as Brochure,
          { id: 'brochure-2' } as Brochure,
        ],
        total: 2,
        page: 1,
        limit: 1000,
      };

      mockBrochureContextService.브로슈어_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.브로슈어_전체_목록을_조회한다();

      // Then
      expect(brochureContextService.브로슈어_목록을_조회한다).toHaveBeenCalledWith(
        undefined,
        'order',
        1,
        1000,
      );
      expect(result).toEqual(mockResult.items);
    });
  });

  describe('브로슈어를_생성한다', () => {
    it('파일 없이 브로슈어를 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '회사 소개',
          description: '설명',
        },
      ];
      const createdBy = 'user-1';

      const mockCreateResult = {
        id: 'brochure-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      const mockDetailResult = {
        id: 'brochure-1',
        isPublic: true,
        translations: [],
      } as any;

      mockBrochureContextService.브로슈어를_생성한다.mockResolvedValue(
        mockCreateResult,
      );
      mockBrochureContextService.브로슈어_상세_조회한다.mockResolvedValue(
        mockDetailResult,
      );

      // When
      const result = await service.브로슈어를_생성한다(
        translations,
        createdBy,
        undefined,
      );

      // Then
      expect(brochureContextService.브로슈어를_생성한다).toHaveBeenCalledWith({
        translations,
        attachments: undefined,
        createdBy,
      });
      expect(brochureContextService.브로슈어_상세_조회한다).toHaveBeenCalledWith(
        'brochure-1',
      );
      expect(result).toEqual(mockDetailResult);
    });

    it('파일과 함께 브로슈어를 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '회사 소개',
        },
      ];
      const createdBy = 'user-1';
      const files = [
        {
          originalname: 'brochure.pdf',
          buffer: Buffer.from('test'),
          size: 1024,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockUploadedFiles = [
        {
          fileName: 'brochure.pdf',
          url: 'https://s3.aws.com/brochure.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      ];

      const mockCreateResult = {
        id: 'brochure-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      const mockDetailResult = {
        id: 'brochure-1',
        isPublic: true,
        translations: [],
        attachments: mockUploadedFiles,
      } as any;

      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockBrochureContextService.브로슈어를_생성한다.mockResolvedValue(
        mockCreateResult,
      );
      mockBrochureContextService.브로슈어_상세_조회한다.mockResolvedValue(
        mockDetailResult,
      );

      // When
      const result = await service.브로슈어를_생성한다(
        translations,
        createdBy,
        files,
      );

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'brochures',
      );
      expect(brochureContextService.브로슈어를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          translations,
          attachments: expect.arrayContaining([
            expect.objectContaining({
              fileName: 'brochure.pdf',
              fileUrl: 'https://s3.aws.com/brochure.pdf',
            }),
          ]),
          createdBy,
        }),
      );
      expect(result.attachments).toEqual(mockUploadedFiles);
    });
  });

  describe('브로슈어_카테고리_목록을_조회한다', () => {
    it('카테고리 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        { id: 'category-1', name: '회사 소개', entityType: 'brochure' },
        { id: 'category-2', name: '제품 소개', entityType: 'brochure' },
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories as any,
      );

      // When
      const result = await service.브로슈어_카테고리_목록을_조회한다();

      // Then
      expect(
        categoryService.엔티티_타입별_카테고리를_조회한다,
      ).toHaveBeenCalledWith('brochure', false);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('브로슈어_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태를 수정해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const updateDto = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: brochureId,
        isPublic: false,
      } as any as Brochure;

      mockBrochureContextService.브로슈어_공개를_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.브로슈어_공개를_수정한다(
        brochureId,
        updateDto,
      );

      // Then
      expect(brochureContextService.브로슈어_공개를_수정한다).toHaveBeenCalledWith(
        brochureId,
        updateDto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어_상세_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 상세 정보를 조회해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const mockBrochure = {
        id: brochureId,
        isPublic: true,
        translations: [],
      } as any;

      mockBrochureContextService.브로슈어_상세_조회한다.mockResolvedValue(
        mockBrochure,
      );

      // When
      const result = await service.브로슈어_상세_조회한다(brochureId);

      // Then
      expect(brochureContextService.브로슈어_상세_조회한다).toHaveBeenCalledWith(
        brochureId,
      );
      expect(result).toEqual(mockBrochure);
    });
  });

  describe('브로슈어를_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 브로슈어를 삭제해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      mockBrochureContextService.브로슈어를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.브로슈어를_삭제한다(brochureId);

      // Then
      expect(brochureContextService.브로슈어를_삭제한다).toHaveBeenCalledWith(
        brochureId,
      );
      expect(result).toBe(true);
    });
  });

  describe('기본_브로슈어들을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 기본 브로슈어를 생성해야 한다', async () => {
      // Given
      const createdBy = 'system';
      const mockBrochures = [
        { id: 'brochure-1' } as Brochure,
        { id: 'brochure-2' } as Brochure,
      ];

      mockBrochureContextService.기본_브로슈어들을_생성한다.mockResolvedValue(
        mockBrochures,
      );

      // When
      const result = await service.기본_브로슈어들을_생성한다(createdBy);

      // Then
      expect(
        brochureContextService.기본_브로슈어들을_생성한다,
      ).toHaveBeenCalledWith(createdBy);
      expect(result).toEqual(mockBrochures);
    });
  });

  describe('기본_브로슈어들을_초기화한다', () => {
    it('컨텍스트 서비스를 호출하여 기본 브로슈어를 초기화해야 한다', async () => {
      // Given
      mockBrochureContextService.기본_브로슈어들을_초기화한다.mockResolvedValue(
        5,
      );

      // When
      const result = await service.기본_브로슈어들을_초기화한다();

      // Then
      expect(
        brochureContextService.기본_브로슈어들을_초기화한다,
      ).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        deletedCount: 5,
      });
    });
  });

  describe('브로슈어_카테고리를_생성한다', () => {
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
        entityType: 'brochure',
      } as Category;

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.브로슈어_카테고리를_생성한다(createDto);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: 'brochure',
        name: createDto.name,
        description: createDto.description,
        isActive: createDto.isActive,
        order: createDto.order,
        createdBy: createDto.createdBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('브로슈어_오더를_일괄_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 순서를 일괄 수정해야 한다', async () => {
      // Given
      const brochures = [
        { id: 'brochure-1', order: 0 },
        { id: 'brochure-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = { success: true, updatedCount: 2 };
      mockBrochureContextService.브로슈어_오더를_일괄_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.브로슈어_오더를_일괄_수정한다(
        brochures,
        updatedBy,
      );

      // Then
      expect(
        brochureContextService.브로슈어_오더를_일괄_수정한다,
      ).toHaveBeenCalledWith({
        brochures,
        updatedBy,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('브로슈어를_수정한다', () => {
    it('파일을 포함하여 브로슈어를 수정해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '수정된 제목',
          description: '수정된 설명',
        },
      ];
      const updatedBy = 'user-1';
      const files = [
        {
          originalname: 'new-brochure.pdf',
          buffer: Buffer.from('test'),
          size: 2048,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockExistingBrochure = {
        id: brochureId,
        attachments: [
          {
            fileName: 'old-brochure.pdf',
            fileUrl: 'https://s3.aws.com/old-brochure.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUploadedFiles = [
        {
          fileName: 'new-brochure.pdf',
          url: 'https://s3.aws.com/new-brochure.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      ];

      const mockUpdatedTranslations = [
        {
          id: 'translation-1',
          brochureId,
          title: '수정된 제목',
        } as BrochureTranslation,
      ];

      mockBrochureContextService.브로슈어_상세_조회한다.mockResolvedValue(
        mockExistingBrochure,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockBrochureContextService.브로슈어_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockBrochureContextService.브로슈어_번역들을_수정한다.mockResolvedValue(
        mockUpdatedTranslations,
      );

      // When
      const result = await service.브로슈어를_수정한다(
        brochureId,
        translations,
        updatedBy,
        files,
      );

      // Then
      expect(brochureContextService.브로슈어_상세_조회한다).toHaveBeenCalledWith(
        brochureId,
      );
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-brochure.pdf',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'brochures',
      );
      expect(brochureContextService.브로슈어_파일을_수정한다).toHaveBeenCalledWith(
        brochureId,
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              fileName: 'new-brochure.pdf',
            }),
          ]),
          updatedBy,
        }),
      );
      expect(
        brochureContextService.브로슈어_번역들을_수정한다,
      ).toHaveBeenCalledWith(brochureId, {
        translations,
        updatedBy,
      });
      expect(result).toEqual(mockUpdatedTranslations);
    });

    it('파일 없이 브로슈어를 수정해야 한다', async () => {
      // Given
      const brochureId = 'brochure-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '수정된 제목',
        },
      ];
      const updatedBy = 'user-1';

      const mockExistingBrochure = {
        id: brochureId,
        attachments: [
          {
            fileName: 'old-brochure.pdf',
            fileUrl: 'https://s3.aws.com/old-brochure.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUpdatedTranslations = [
        {
          id: 'translation-1',
          brochureId,
          title: '수정된 제목',
        } as BrochureTranslation,
      ];

      mockBrochureContextService.브로슈어_상세_조회한다.mockResolvedValue(
        mockExistingBrochure,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockBrochureContextService.브로슈어_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockBrochureContextService.브로슈어_번역들을_수정한다.mockResolvedValue(
        mockUpdatedTranslations,
      );

      // When
      const result = await service.브로슈어를_수정한다(
        brochureId,
        translations,
        updatedBy,
        undefined,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-brochure.pdf',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(brochureContextService.브로슈어_파일을_수정한다).toHaveBeenCalledWith(
        brochureId,
        expect.objectContaining({
          attachments: [],
          updatedBy,
        }),
      );
      expect(result).toEqual(mockUpdatedTranslations);
    });
  });
});
