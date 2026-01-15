import { Test, TestingModule } from '@nestjs/testing';
import { ElectronicDisclosureBusinessService } from '@business/electronic-disclosure-business/electronic-disclosure-business.service';
import { ElectronicDisclosureContextService } from '@context/electronic-disclosure-context/electronic-disclosure-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import { Category } from '@domain/common/category/category.entity';

describe('ElectronicDisclosureBusinessService', () => {
  let service: ElectronicDisclosureBusinessService;
  let electronicDisclosureContextService: jest.Mocked<ElectronicDisclosureContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockElectronicDisclosureContextService = {
    전자공시를_생성한다: jest.fn(),
    전자공시를_수정한다: jest.fn(),
    전자공시를_삭제한다: jest.fn(),
    전자공시_상세를_조회한다: jest.fn(),
    전자공시_목록을_조회한다: jest.fn(),
    전자공시_공개를_수정한다: jest.fn(),
    전자공시_오더를_일괄_수정한다: jest.fn(),
    전자공시_파일을_수정한다: jest.fn(),
    전자공시_전체_목록을_조회한다: jest.fn(),
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
        ElectronicDisclosureBusinessService,
        {
          provide: ElectronicDisclosureContextService,
          useValue: mockElectronicDisclosureContextService,
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

    service = module.get<ElectronicDisclosureBusinessService>(
      ElectronicDisclosureBusinessService,
    );
    electronicDisclosureContextService = module.get(
      ElectronicDisclosureContextService,
    );
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('전자공시_전체_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 전체 목록을 조회해야 한다', async () => {
      // Given
      const mockDisclosures = [
        {
          id: 'disclosure-1',
          isPublic: true,
          order: 0,
        } as ElectronicDisclosure,
        {
          id: 'disclosure-2',
          isPublic: true,
          order: 1,
        } as ElectronicDisclosure,
      ];

      mockElectronicDisclosureContextService.전자공시_전체_목록을_조회한다.mockResolvedValue(
        mockDisclosures,
      );

      // When
      const result = await service.전자공시_전체_목록을_조회한다();

      // Then
      expect(
        electronicDisclosureContextService.전자공시_전체_목록을_조회한다,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockDisclosures);
    });
  });

  describe('전자공시_상세를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 상세 정보를 조회해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const mockDisclosure = {
        id: disclosureId,
        isPublic: true,
        translations: [],
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureContextService.전자공시_상세를_조회한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시_상세를_조회한다(disclosureId);

      // Then
      expect(
        electronicDisclosureContextService.전자공시_상세를_조회한다,
      ).toHaveBeenCalledWith(disclosureId);
      expect(result).toEqual(mockDisclosure);
    });
  });

  describe('전자공시를_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 전자공시를 삭제해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      mockElectronicDisclosureContextService.전자공시를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.전자공시를_삭제한다(disclosureId);

      // Then
      expect(
        electronicDisclosureContextService.전자공시를_삭제한다,
      ).toHaveBeenCalledWith(disclosureId);
      expect(result).toBe(true);
    });
  });

  describe('전자공시_공개를_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 공개 상태를 수정해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockDisclosure = {
        id: disclosureId,
        isPublic,
      } as ElectronicDisclosure;

      mockElectronicDisclosureContextService.전자공시_공개를_수정한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시_공개를_수정한다(
        disclosureId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(
        electronicDisclosureContextService.전자공시_공개를_수정한다,
      ).toHaveBeenCalledWith(disclosureId, isPublic, updatedBy);
      expect(result).toEqual(mockDisclosure);
    });
  });

  describe('전자공시를_생성한다', () => {
    it('파일 없이 전자공시를 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '2024년 1분기 실적 공시',
          description: '2024년 1분기 실적 공시 자료',
        },
      ];
      const createdBy = 'user-1';

      const mockDisclosure = {
        id: 'disclosure-1',
        isPublic: true,
        order: 0,
        attachments: null,
        translations: [],
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureContextService.전자공시를_생성한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시를_생성한다(translations, createdBy, undefined);

      // Then
      expect(
        electronicDisclosureContextService.전자공시를_생성한다,
      ).toHaveBeenCalledWith(translations, createdBy, undefined);
      expect(result).toEqual(mockDisclosure);
    });

    it('파일과 함께 전자공시를 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '2024년 1분기 실적 공시',
        },
      ];
      const createdBy = 'user-1';
      const files = [
        {
          originalname: 'disclosure.pdf',
          buffer: Buffer.from('test'),
          size: 2048,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockUploadedFiles = [
        {
          fileName: 'disclosure.pdf',
          url: 'https://s3.aws.com/disclosure.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      ];

      const mockDisclosure = {
        id: 'disclosure-1',
        isPublic: true,
        order: 0,
        attachments: mockUploadedFiles,
        translations: [],
      } as any as ElectronicDisclosure;

      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockElectronicDisclosureContextService.전자공시를_생성한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시를_생성한다(translations, createdBy, files);

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'electronic-disclosures',
      );
      expect(
        electronicDisclosureContextService.전자공시를_생성한다,
      ).toHaveBeenCalledWith(
        translations,
        createdBy,
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'disclosure.pdf',
            fileUrl: 'https://s3.aws.com/disclosure.pdf',
          }),
        ]),
      );
      expect(result.attachments).toEqual(mockUploadedFiles);
    });
  });

  describe('전자공시를_수정한다', () => {
    it('파일을 포함하여 전자공시를 수정해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
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
          originalname: 'new-disclosure.pdf',
          buffer: Buffer.from('test'),
          size: 4096,
          mimetype: 'application/pdf',
        } as Express.Multer.File,
      ];

      const mockExistingDisclosure = {
        id: disclosureId,
        attachments: [
          {
            fileName: 'old-disclosure.pdf',
            fileUrl: 'https://s3.aws.com/old-disclosure.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUploadedFiles = [
        {
          fileName: 'new-disclosure.pdf',
          url: 'https://s3.aws.com/new-disclosure.pdf',
          fileSize: 4096,
          mimeType: 'application/pdf',
        },
      ];

      const mockUpdatedDisclosure = {
        id: disclosureId,
        attachments: mockUploadedFiles,
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureContextService.전자공시_상세를_조회한다.mockResolvedValue(
        mockExistingDisclosure,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockElectronicDisclosureContextService.전자공시_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockElectronicDisclosureContextService.전자공시를_수정한다.mockResolvedValue(
        mockUpdatedDisclosure,
      );

      // When
      const result = await service.전자공시를_수정한다(
        disclosureId,
        translations,
        updatedBy,
        files,
      );

      // Then
      expect(
        electronicDisclosureContextService.전자공시_상세를_조회한다,
      ).toHaveBeenCalledWith(disclosureId);
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-disclosure.pdf',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'electronic-disclosures',
      );
      expect(
        electronicDisclosureContextService.전자공시_파일을_수정한다,
      ).toHaveBeenCalledWith(
        disclosureId,
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'new-disclosure.pdf',
          }),
        ]),
        updatedBy,
      );
      expect(electronicDisclosureContextService.전자공시를_수정한다).toHaveBeenCalledWith(
        disclosureId,
        {
          translations,
          updatedBy,
        },
      );
      expect(result).toEqual(mockUpdatedDisclosure);
    });

    it('파일 없이 전자공시를 수정해야 한다 (기존 파일 삭제)', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '수정된 제목',
        },
      ];
      const updatedBy = 'user-1';

      const mockExistingDisclosure = {
        id: disclosureId,
        attachments: [
          {
            fileName: 'old-disclosure.pdf',
            fileUrl: 'https://s3.aws.com/old-disclosure.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
          },
        ],
      } as any;

      const mockUpdatedDisclosure = {
        id: disclosureId,
        attachments: [],
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureContextService.전자공시_상세를_조회한다.mockResolvedValue(
        mockExistingDisclosure,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockElectronicDisclosureContextService.전자공시_파일을_수정한다.mockResolvedValue(
        {} as any,
      );
      mockElectronicDisclosureContextService.전자공시를_수정한다.mockResolvedValue(
        mockUpdatedDisclosure,
      );

      // When
      const result = await service.전자공시를_수정한다(
        disclosureId,
        translations,
        updatedBy,
        undefined,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-disclosure.pdf',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(
        electronicDisclosureContextService.전자공시_파일을_수정한다,
      ).toHaveBeenCalledWith(disclosureId, [], updatedBy);
      expect(result.attachments).toEqual([]);
    });
  });

  describe('전자공시_오더를_일괄_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 순서를 일괄 수정해야 한다', async () => {
      // Given
      const electronicDisclosures = [
        { id: 'disclosure-1', order: 0 },
        { id: 'disclosure-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = { success: true, updatedCount: 2 };
      mockElectronicDisclosureContextService.전자공시_오더를_일괄_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.전자공시_오더를_일괄_수정한다(
        electronicDisclosures,
        updatedBy,
      );

      // Then
      expect(
        electronicDisclosureContextService.전자공시_오더를_일괄_수정한다,
      ).toHaveBeenCalledWith(electronicDisclosures, updatedBy);
      expect(result).toEqual(mockResult);
    });
  });

  describe('전자공시_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 목록을 조회하고 DTO로 변환해야 한다', async () => {
      // Given
      const mockResult = {
        items: [
          {
            id: 'disclosure-1',
            isPublic: true,
            order: 0,
            translations: [
              {
                title: '2024년 1분기 실적 공시',
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

      mockElectronicDisclosureContextService.전자공시_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.전자공시_목록을_조회한다(true, 'order', 1, 10);

      // Then
      expect(
        electronicDisclosureContextService.전자공시_목록을_조회한다,
      ).toHaveBeenCalledWith(true, 'order', 1, 10, undefined, undefined);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('2024년 1분기 실적 공시');
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

      mockElectronicDisclosureContextService.전자공시_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.전자공시_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(
        electronicDisclosureContextService.전자공시_목록을_조회한다,
      ).toHaveBeenCalledWith(undefined, 'order', 1, 10, startDate, endDate);
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

      mockElectronicDisclosureContextService.전자공시_목록을_조회한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.전자공시_목록을_조회한다(undefined, 'order', 1, 10);

      // Then
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('전자공시_카테고리_목록을_조회한다', () => {
    it('카테고리 서비스를 호출하여 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        {
          id: 'category-1',
          name: '재무제표',
          entityType: 'electronic-disclosure',
        },
        {
          id: 'category-2',
          name: '사업보고서',
          entityType: 'electronic-disclosure',
        },
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories as any,
      );

      // When
      const result = await service.전자공시_카테고리_목록을_조회한다();

      // Then
      expect(
        categoryService.엔티티_타입별_카테고리를_조회한다,
      ).toHaveBeenCalledWith('electronic_disclosure', true);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('전자공시_카테고리를_생성한다', () => {
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
        entityType: 'electronic_disclosure',
      } as Category;

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.전자공시_카테고리를_생성한다(createDto);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: 'electronic_disclosure',
        name: createDto.name,
        description: createDto.description,
        isActive: createDto.isActive,
        order: createDto.order,
        createdBy: createDto.createdBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('전자공시_카테고리를_수정한다', () => {
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
        entityType: 'electronic-disclosure',
      } as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.전자공시_카테고리를_수정한다(categoryId, updateDto);

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(
        categoryId,
        updateDto,
      );
      expect(result).toEqual(mockCategory);
    });
  });

  describe('전자공시_카테고리_오더를_변경한다', () => {
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
        entityType: 'electronic-disclosure',
      } as any as Category;

      mockCategoryService.카테고리를_업데이트한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.전자공시_카테고리_오더를_변경한다(categoryId, data);

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(categoryId, {
        order: data.order,
        updatedBy: data.updatedBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('전자공시_카테고리를_삭제한다', () => {
    it('카테고리 서비스를 호출하여 카테고리를 삭제해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      mockCategoryService.카테고리를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.전자공시_카테고리를_삭제한다(categoryId);

      // Then
      expect(categoryService.카테고리를_삭제한다).toHaveBeenCalledWith(categoryId);
      expect(result).toBe(true);
    });
  });
});
