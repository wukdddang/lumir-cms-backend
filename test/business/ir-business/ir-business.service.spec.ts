import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IRBusinessService } from '@business/ir-business/ir-business.service';
import { IRContextService } from '@context/ir-context/ir-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { IR } from '@domain/core/ir/ir.entity';
import { Category } from '@domain/common/category/category.entity';

describe('IRBusinessService', () => {
  let service: IRBusinessService;
  let irContextService: jest.Mocked<IRContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockIRContextService = {
    IR을_생성한다: jest.fn(),
    IR을_수정한다: jest.fn(),
    IR을_삭제한다: jest.fn(),
    IR_상세를_조회한다: jest.fn(),
    IR_목록을_조회한다: jest.fn(),
    IR_공개를_수정한다: jest.fn(),
    IR_오더를_일괄_수정한다: jest.fn(),
    IR_파일을_수정한다: jest.fn(),
    IR_전체_목록을_조회한다: jest.fn(),
  };

  const mockCategoryService = {
    엔티티_타입별_카테고리를_조회한다: jest.fn(),
    엔티티의_카테고리_매핑을_조회한다: jest.fn(),
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

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'DEFAULT_LANGUAGE_CODE') return 'en';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IRBusinessService,
        {
          provide: IRContextService,
          useValue: mockIRContextService,
        },
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: STORAGE_SERVICE,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<IRBusinessService>(IRBusinessService);
    irContextService = module.get(IRContextService);
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IR_전체_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 전체 목록을 조회하고 카테고리를 포함해야 한다', async () => {
      // Given
      const mockIRs = [
        {
          id: 'ir-1',
          isPublic: true,
          order: 0,
        } as IR,
        {
          id: 'ir-2',
          isPublic: true,
          order: 1,
        } as IR,
      ];

      const mockCategories1 = [{ id: 'category-1', name: '재무제표' }];
      const mockCategories2 = [];

      mockIRContextService.IR_전체_목록을_조회한다.mockResolvedValue(mockIRs);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다
        .mockResolvedValueOnce(mockCategories1)
        .mockResolvedValueOnce(mockCategories2);

      // When
      const result = await service.IR_전체_목록을_조회한다();

      // Then
      expect(irContextService.IR_전체_목록을_조회한다).toHaveBeenCalled();
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('categories');
      expect(result[0].categories).toEqual(mockCategories1);
    });
  });

  describe('IR_상세를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 상세 정보와 카테고리를 조회해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const mockIR = {
        id: irId,
        isPublic: true,
        translations: [],
      } as any as IR;

      const mockCategories = [{ id: 'category-1', name: '재무제표' }];

      mockIRContextService.IR_상세를_조회한다.mockResolvedValue(mockIR);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다.mockResolvedValue(mockCategories);

      // When
      const result = await service.IR_상세를_조회한다(irId);

      // Then
      expect(irContextService.IR_상세를_조회한다).toHaveBeenCalledWith(irId);
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledWith(irId);
      expect(result).toHaveProperty('categories');
      expect(result.categories).toEqual(mockCategories);
    });
  });

  describe('IR을_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 IR을 삭제해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      mockIRContextService.IR을_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.IR을_삭제한다(irId);

      // Then
      expect(irContextService.IR을_삭제한다).toHaveBeenCalledWith(irId);
      expect(result).toBe(true);
    });
  });

  describe('IR_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태와 카테고리를 수정해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockIR = {
        id: irId,
        isPublic,
      } as IR;

      const mockCategories = [{ id: 'category-1', name: '재무제표' }];

      mockIRContextService.IR_공개를_수정한다.mockResolvedValue(mockIR);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다.mockResolvedValue(mockCategories);

      // When
      const result = await service.IR_공개를_수정한다(
        irId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(irContextService.IR_공개를_수정한다).toHaveBeenCalledWith(
        irId,
        isPublic,
        updatedBy,
      );
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledWith(irId);
      expect(result).toHaveProperty('categories');
      expect(result.categories).toEqual(mockCategories);
    });
  });

  describe('IR을_생성한다', () => {
    it('파일 없이 IR을 생성하고 카테고리를 포함해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '2024년 1분기 IR 자료',
          description: '2024년 1분기 IR 자료',
        },
      ];
      const createdBy = 'user-1';
      const categoryId = 'category-1';

      const mockIR = {
        id: 'ir-1',
        isPublic: true,
        order: 0,
        attachments: null,
        translations: [],
      } as any as IR;

      const mockCategories = [{ id: categoryId, name: '재무제표' }];

      mockIRContextService.IR을_생성한다.mockResolvedValue(mockIR);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다.mockResolvedValue(mockCategories);

      // When
      const result = await service.IR을_생성한다(translations, createdBy, undefined, categoryId);

      // Then
      expect(irContextService.IR을_생성한다).toHaveBeenCalledWith(
        translations,
        createdBy,
        undefined,
        categoryId,
      );
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledWith('ir-1');
      expect(result).toHaveProperty('categories');
      expect((result as any).categories).toEqual(mockCategories);
    });

    it('파일과 함께 IR을 생성하고 카테고리를 포함해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '2024년 1분기 IR 자료',
        },
      ];
      const createdBy = 'user-1';
      const categoryId = 'category-1';
      const files = [
        {
          originalname: 'ir.pdf',
          buffer: Buffer.from('test'),
          size: 2048,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockUploadedFiles = [
        {
          fileName: 'ir.pdf',
          url: 'https://s3.aws.com/ir.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      ];

      const mockIR = {
        id: 'ir-1',
        isPublic: true,
        order: 0,
        attachments: mockUploadedFiles,
        translations: [],
      } as any as IR;

      const mockCategories = [{ id: categoryId, name: '재무제표' }];

      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockIRContextService.IR을_생성한다.mockResolvedValue(mockIR);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다.mockResolvedValue(mockCategories);

      // When
      const result = await service.IR을_생성한다(translations, createdBy, files, categoryId);

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(files, 'irs');
      expect(irContextService.IR을_생성한다).toHaveBeenCalledWith(
        translations,
        createdBy,
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'ir.pdf',
            fileUrl: 'https://s3.aws.com/ir.pdf',
          }),
        ]),
        categoryId,
      );
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledWith('ir-1');
      expect(result).toHaveProperty('categories');
      expect((result as any).categories).toEqual(mockCategories);
    });
  });

  describe('IR을_수정한다', () => {
    it('파일을 포함하여 IR을 수정하고 카테고리를 포함해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '수정된 제목',
          description: '수정된 설명',
        },
      ];
      const updatedBy = 'user-1';
      const categoryId = 'category-1';
      const files = [
        {
          originalname: 'new-ir.pdf',
          buffer: Buffer.from('test'),
          size: 4096,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockExistingIR = {
        id: irId,
        attachments: [
          {
            fileName: 'old-ir.pdf',
            fileUrl: 'https://s3.aws.com/old-ir.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUploadedFiles = [
        {
          fileName: 'new-ir.pdf',
          url: 'https://s3.aws.com/new-ir.pdf',
          fileSize: 4096,
          mimeType: 'application/pdf',
        },
      ];

      const mockUpdatedIR = {
        id: irId,
        attachments: mockUploadedFiles,
      } as any as IR;

      const mockCategories = [{ id: 'category-1', name: '재무제표' }];

      mockIRContextService.IR_상세를_조회한다.mockResolvedValue(mockExistingIR);
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockIRContextService.IR_파일을_수정한다.mockResolvedValue({} as any);
      mockIRContextService.IR을_수정한다.mockResolvedValue(mockUpdatedIR);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다.mockResolvedValue(mockCategories);

      // When
      const result = await service.IR을_수정한다(
        irId,
        translations,
        updatedBy,
        categoryId,
        files,
      );

      // Then
      expect(irContextService.IR_상세를_조회한다).toHaveBeenCalledWith(irId);
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-ir.pdf',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(files, 'irs');
      expect(irContextService.IR_파일을_수정한다).toHaveBeenCalledWith(
        irId,
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'new-ir.pdf',
          }),
        ]),
        updatedBy,
      );
      expect(irContextService.IR을_수정한다).toHaveBeenCalledWith(irId, expect.objectContaining({
        categoryId,
        updatedBy,
      }));
      expect(irContextService.IR을_수정한다).toHaveBeenCalledWith(irId, {
        translations,
        updatedBy,
      });
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledWith(irId);
      expect(result).toHaveProperty('categories');
    });

    it('파일 없이 IR을 수정하고 카테고리를 포함해야 한다 (기존 파일 삭제)', async () => {
      // Given
      const irId = 'ir-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '수정된 제목',
        },
      ];
      const updatedBy = 'user-1';
      const categoryId = 'category-1';

      const mockExistingIR = {
        id: irId,
        attachments: [
          {
            fileName: 'old-ir.pdf',
            fileUrl: 'https://s3.aws.com/old-ir.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUpdatedIR = {
        id: irId,
        attachments: [],
      } as any as IR;

      const mockCategories = [];

      mockIRContextService.IR_상세를_조회한다.mockResolvedValue(mockExistingIR);
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockIRContextService.IR_파일을_수정한다.mockResolvedValue({} as any);
      mockIRContextService.IR을_수정한다.mockResolvedValue(mockUpdatedIR);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다.mockResolvedValue(mockCategories);

      // When
      const result = await service.IR을_수정한다(
        irId,
        translations,
        updatedBy,
        categoryId,
        undefined,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-ir.pdf',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(irContextService.IR_파일을_수정한다).toHaveBeenCalledWith(
        irId,
        [],
        updatedBy,
      );
      expect(irContextService.IR을_수정한다).toHaveBeenCalledWith(irId, expect.objectContaining({
        categoryId,
        updatedBy,
      }));
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledWith(irId);
      expect(result).toHaveProperty('categories');
    });
  });

  describe('IR_오더를_일괄_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 순서를 일괄 수정해야 한다', async () => {
      // Given
      const irs = [
        { id: 'ir-1', order: 0 },
        { id: 'ir-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = { success: true, updatedCount: 2 };
      mockIRContextService.IR_오더를_일괄_수정한다.mockResolvedValue(mockResult);

      // When
      const result = await service.IR_오더를_일괄_수정한다(irs, updatedBy);

      // Then
      expect(irContextService.IR_오더를_일괄_수정한다).toHaveBeenCalledWith(
        irs,
        updatedBy,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('IR_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 목록을 조회하고 카테고리를 포함한 DTO로 변환해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          {
            id: 'ir-1',
            isPublic: true,
            order: 0,
            translations: [
              {
                title: '2024년 1분기 IR 자료',
                description: '설명',
                language: { code: 'ko' },
              },
            ],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
          } as any,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      const mockCategories = [{ id: 'category-1', name: '재무제표' }];

      mockIRContextService.IR_목록을_조회한다.mockResolvedValue(mockResult);
      mockCategoryService.엔티티의_카테고리_매핑을_조회한다.mockResolvedValue(mockCategories);

      // When
      const result = await service.IR_목록을_조회한다(true, 'order', 1, 10);

      // Then
      expect(irContextService.IR_목록을_조회한다).toHaveBeenCalledWith(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
      );
      expect(categoryService.엔티티의_카테고리_매핑을_조회한다).toHaveBeenCalledWith('ir-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('2024년 1분기 IR 자료');
      expect(result.items[0]).toHaveProperty('categories');
      expect(result.items[0].categories).toEqual(mockCategories);
      expect(result.totalPages).toBe(1);
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

      mockIRContextService.IR_목록을_조회한다.mockResolvedValue(mockResult);

      // When
      const result = await service.IR_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(irContextService.IR_목록을_조회한다).toHaveBeenCalledWith(
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

      mockIRContextService.IR_목록을_조회한다.mockResolvedValue(mockResult);

      // When
      const result = await service.IR_목록을_조회한다(undefined, 'order', 1, 10);

      // Then
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('IR_카테고리_목록을_조회한다', () => {
    it('카테고리 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        {
          id: 'category-1',
          name: '재무제표',
          entityType: 'ir',
        },
        {
          id: 'category-2',
          name: '사업보고서',
          entityType: 'ir',
        },
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories as any,
      );

      // When
      const result = await service.IR_카테고리_목록을_조회한다();

      // Then
      expect(
        categoryService.엔티티_타입별_카테고리를_조회한다,
      ).toHaveBeenCalledWith('ir', true);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('IR_카테고리를_생성한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        name: '지배구조',
        description: '지배구조 카테고리',
        isActive: true,
        order: 5,
        createdBy: 'user-1',
      };

      const mockCategory = {
        id: 'category-1',
        ...createDto,
        entityType: 'ir',
      } as Category;

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.IR_카테고리를_생성한다(createDto);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: 'ir',
        name: createDto.name,
        description: createDto.description,
        isActive: createDto.isActive,
        order: createDto.order,
        createdBy: createDto.createdBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('IR_카테고리를_수정한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 수정해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      const updateDto = {
        name: '수정된 카테고리',
        description: '수정된 설명',
        isActive: false,
        order: 10,
        updatedBy: 'user-1',
      };

      const mockCategory = {
        id: categoryId,
        ...updateDto,
        entityType: 'ir',
      } as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.IR_카테고리를_수정한다(categoryId, updateDto);

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(
        categoryId,
        updateDto,
      );
      expect(result).toEqual(mockCategory);
    });
  });

  describe('IR_카테고리_오더를_변경한다', () => {
    it('카테고리 서비스를 호출하여 순서를 변경해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      const data = {
        order: 15,
        updatedBy: 'user-1',
      };

      const mockCategory = {
        id: categoryId,
        ...data,
        entityType: 'ir',
      } as any as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.IR_카테고리_오더를_변경한다(categoryId, data);

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(
        categoryId,
        {
          order: data.order,
          updatedBy: data.updatedBy,
        },
      );
      expect(result).toEqual(mockCategory);
    });
  });

  describe('IR_카테고리를_삭제한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 삭제해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      mockCategoryService.카테고리를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.IR_카테고리를_삭제한다(categoryId);

      // Then
      expect(categoryService.카테고리를_삭제한다).toHaveBeenCalledWith(categoryId);
      expect(result).toBe(true);
    });
  });
});
