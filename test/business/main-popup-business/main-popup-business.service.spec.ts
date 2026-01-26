import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MainPopupBusinessService } from '@business/main-popup-business/main-popup-business.service';
import { MainPopupContextService } from '@context/main-popup-context/main-popup-context.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import { Category } from '@domain/common/category/category.entity';
import { CategoryEntityType } from '@domain/common/category/category-entity-type.types';

describe('MainPopupBusinessService', () => {
  let service: MainPopupBusinessService;
  let mainPopupContextService: jest.Mocked<MainPopupContextService>;
  let categoryService: jest.Mocked<CategoryService>;
  let storageService: jest.Mocked<IStorageService>;

  const mockMainPopupContextService = {
    메인_팝업을_생성한다: jest.fn(),
    메인_팝업을_수정한다: jest.fn(),
    메인_팝업을_삭제한다: jest.fn(),
    메인_팝업_상세를_조회한다: jest.fn(),
    메인_팝업_목록을_조회한다: jest.fn(),
    메인_팝업_공개를_수정한다: jest.fn(),
    메인_팝업_오더를_일괄_수정한다: jest.fn(),
    메인_팝업_파일을_수정한다: jest.fn(),
    메인_팝업_전체_목록을_조회한다: jest.fn(),
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

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'DEFAULT_LANGUAGE_CODE') return 'en';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MainPopupBusinessService,
        {
          provide: MainPopupContextService,
          useValue: mockMainPopupContextService,
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

    service = module.get<MainPopupBusinessService>(MainPopupBusinessService);
    mainPopupContextService = module.get(MainPopupContextService);
    categoryService = module.get(CategoryService);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('메인_팝업_전체_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 전체 목록을 조회해야 한다', async () => {
      // Given
      const mockPopups = [
        {
          id: 'popup-1',
          isPublic: true,
          order: 0,
        } as MainPopup,
        {
          id: 'popup-2',
          isPublic: true,
          order: 1,
        } as MainPopup,
      ];

      mockMainPopupContextService.메인_팝업_전체_목록을_조회한다.mockResolvedValue(
        mockPopups,
      );

      // When
      const result = await service.메인_팝업_전체_목록을_조회한다();

      // Then
      expect(
        mainPopupContextService.메인_팝업_전체_목록을_조회한다,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockPopups);
    });
  });

  describe('메인_팝업_상세를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 상세 정보를 조회해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const mockPopup = {
        id: popupId,
        isPublic: true,
        translations: [],
      } as Partial<MainPopup> as MainPopup;

      mockMainPopupContextService.메인_팝업_상세를_조회한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업_상세를_조회한다(popupId);

      // Then
      expect(
        mainPopupContextService.메인_팝업_상세를_조회한다,
      ).toHaveBeenCalledWith(popupId);
      expect(result).toEqual(mockPopup);
    });
  });

  describe('메인_팝업을_삭제한다', () => {
    it('컨텍스트 서비스를 호출하여 삭제해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      mockMainPopupContextService.메인_팝업을_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.메인_팝업을_삭제한다(popupId);

      // Then
      expect(mainPopupContextService.메인_팝업을_삭제한다).toHaveBeenCalledWith(
        popupId,
      );
      expect(result).toBe(true);
    });
  });

  describe('메인_팝업_공개를_수정한다', () => {
    it('공개 여부를 수정해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockPopup = {
        id: popupId,
        isPublic,
      } as MainPopup;

      mockMainPopupContextService.메인_팝업_공개를_수정한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업_공개를_수정한다(
        popupId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(
        mainPopupContextService.메인_팝업_공개를_수정한다,
      ).toHaveBeenCalledWith(popupId, isPublic, updatedBy);
      expect(result).toEqual(mockPopup);
    });
  });

  describe('메인_팝업을_생성한다', () => {
    it('파일 없이 메인 팝업을 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'lang-ko',
          title: '메인 팝업 제목',
          description: '메인 팝업 설명',
        },
      ];
      const createdBy = 'user-1';
      const categoryId = 'category-1';

      const mockPopup = {
        id: 'popup-1',
        isPublic: true,
        order: 0,
        categoryId,
        translations: [],
      } as Partial<MainPopup> as MainPopup;

      mockMainPopupContextService.메인_팝업을_생성한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_생성한다(
        translations,
        categoryId,
        createdBy,
        undefined,
      );

      // Then
      expect(mainPopupContextService.메인_팝업을_생성한다).toHaveBeenCalledWith(
        translations,
        categoryId,
        createdBy,
        undefined,
      );
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(result).toEqual(mockPopup);
    });

    it('파일과 함께 메인 팝업을 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'lang-ko',
          title: '메인 팝업 제목',
          description: '메인 팝업 설명',
        },
      ];
      const createdBy = 'user-1';
      const categoryId = 'category-1';
      const files = [
        {
          originalname: 'popup.jpg',
          buffer: Buffer.from('test'),
          size: 1024000,
          mimetype: 'image/jpeg',
        } as Express.Multer.File,
      ];

      const uploadedFiles = [
        {
          fileName: 'popup.jpg',
          url: 'https://s3.aws.com/popup.jpg',
          fileSize: 1024000,
          mimeType: 'image/jpeg',
        },
      ];

      const mockPopup = {
        id: 'popup-1',
        isPublic: true,
        order: 0,
        categoryId,
        attachments: [
          {
            fileName: 'popup.jpg',
            fileUrl: 'https://s3.aws.com/popup.jpg',
            fileSize: 1024000,
            mimeType: 'image/jpeg',
          },
        ],
      } as MainPopup;

      mockStorageService.uploadFiles.mockResolvedValue(uploadedFiles);
      mockMainPopupContextService.메인_팝업을_생성한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_생성한다(
        translations,
        categoryId,
        createdBy,
        files,
      );

      // Then
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        files,
        'main-popups',
      );
      expect(mainPopupContextService.메인_팝업을_생성한다).toHaveBeenCalledWith(
        translations,
        categoryId,
        createdBy,
        [
          {
            fileName: 'popup.jpg',
            fileUrl: 'https://s3.aws.com/popup.jpg',
            fileSize: 1024000,
            mimeType: 'image/jpeg',
          },
        ],
      );
      expect(result).toEqual(mockPopup);
    });

    it('카테고리와 함께 메인 팝업을 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'lang-ko',
          title: '메인 팝업 제목',
          description: '메인 팝업 설명',
        },
      ];
      const createdBy = 'user-1';
      const categoryId = 'category-1';

      const mockPopup = {
        id: 'popup-1',
        isPublic: true,
        order: 0,
        categoryId,
        translations: [],
      } as Partial<MainPopup> as MainPopup;

      mockMainPopupContextService.메인_팝업을_생성한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_생성한다(
        translations,
        categoryId,
        createdBy,
        undefined,
      );

      // Then
      expect(mainPopupContextService.메인_팝업을_생성한다).toHaveBeenCalledWith(
        translations,
        categoryId,
        createdBy,
        undefined,
      );
      expect(result).toEqual(mockPopup);
    });
  });

  describe('메인_팝업을_수정한다', () => {
    it('파일 없이 메인 팝업을 수정해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const translations = [
        {
          languageId: 'lang-ko',
          title: '수정된 제목',
          description: '수정된 설명',
        },
      ];
      const updatedBy = 'user-1';
      const categoryId = 'category-1';

      const existingPopup = {
        id: popupId,
        isPublic: true,
        categoryId,
        attachments: [],
      } as Partial<MainPopup> as MainPopup;

      const updatedPopup = {
        ...existingPopup,
      } as MainPopup;

      mockMainPopupContextService.메인_팝업_상세를_조회한다.mockResolvedValue(
        existingPopup,
      );
      mockMainPopupContextService.메인_팝업_파일을_수정한다.mockResolvedValue(
        existingPopup,
      );
      mockMainPopupContextService.메인_팝업을_수정한다.mockResolvedValue(
        updatedPopup,
      );

      // When
      const result = await service.메인_팝업을_수정한다(
        popupId,
        translations,
        categoryId,
        updatedBy,
        undefined,
      );

      // Then
      expect(
        mainPopupContextService.메인_팝업_상세를_조회한다,
      ).toHaveBeenCalledWith(popupId);
      expect(storageService.deleteFiles).not.toHaveBeenCalled();
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(mainPopupContextService.메인_팝업을_수정한다).toHaveBeenCalledWith(
        popupId,
        {
          translations,
          categoryId,
          updatedBy,
        },
      );
      expect(result).toEqual(updatedPopup);
    });

    it('기존 파일을 삭제하고 새 파일로 교체해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const translations = [
        {
          languageId: 'lang-ko',
          title: '수정된 제목',
        },
      ];
      const updatedBy = 'user-1';
      const newFiles = [
        {
          originalname: 'new-popup.jpg',
          buffer: Buffer.from('test'),
          size: 2048000,
          mimetype: 'image/jpeg',
        } as Express.Multer.File,
      ];

      const existingPopup = {
        id: popupId,
        isPublic: true,
        attachments: [
          {
            fileName: 'old-popup.jpg',
            fileUrl: 'https://s3.aws.com/old-popup.jpg',
            fileSize: 1024000,
            mimeType: 'image/jpeg',
          },
        ],
      } as MainPopup;

      const uploadedFiles = [
        {
          fileName: 'new-popup.jpg',
          url: 'https://s3.aws.com/new-popup.jpg',
          fileSize: 2048000,
          mimeType: 'image/jpeg',
        },
      ];

      const updatedPopup = {
        ...existingPopup,
        attachments: [
          {
            fileName: 'new-popup.jpg',
            fileUrl: 'https://s3.aws.com/new-popup.jpg',
            fileSize: 2048000,
            mimeType: 'image/jpeg',
          },
        ],
      } as MainPopup;

      mockMainPopupContextService.메인_팝업_상세를_조회한다.mockResolvedValue(
        existingPopup,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockStorageService.uploadFiles.mockResolvedValue(uploadedFiles);
      mockMainPopupContextService.메인_팝업_파일을_수정한다.mockResolvedValue(
        updatedPopup,
      );
      mockMainPopupContextService.메인_팝업을_수정한다.mockResolvedValue(
        updatedPopup,
      );

      // When
      const result = await service.메인_팝업을_수정한다(
        popupId,
        translations,
        'category-1',
        updatedBy,
        newFiles,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-popup.jpg',
      ]);
      expect(storageService.uploadFiles).toHaveBeenCalledWith(
        newFiles,
        'main-popups',
      );
      expect(
        mainPopupContextService.메인_팝업_파일을_수정한다,
      ).toHaveBeenCalledWith(
        popupId,
        [
          {
            fileName: 'new-popup.jpg',
            fileUrl: 'https://s3.aws.com/new-popup.jpg',
            fileSize: 2048000,
            mimeType: 'image/jpeg',
          },
        ],
        updatedBy,
      );
      expect(result).toEqual(updatedPopup);
    });

    it('기존 파일만 삭제하고 새 파일을 업로드하지 않아야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const translations = [
        {
          languageId: 'lang-ko',
          title: '수정된 제목',
        },
      ];
      const updatedBy = 'user-1';

      const existingPopup = {
        id: popupId,
        isPublic: true,
        attachments: [
          {
            fileName: 'old-popup.jpg',
            fileUrl: 'https://s3.aws.com/old-popup.jpg',
            fileSize: 1024000,
            mimeType: 'image/jpeg',
          },
        ],
      } as MainPopup;

      const updatedPopup = {
        ...existingPopup,
        attachments: [],
      } as Partial<MainPopup> as MainPopup;

      mockMainPopupContextService.메인_팝업_상세를_조회한다.mockResolvedValue(
        existingPopup,
      );
      mockStorageService.deleteFiles.mockResolvedValue(undefined);
      mockMainPopupContextService.메인_팝업_파일을_수정한다.mockResolvedValue(
        updatedPopup,
      );
      mockMainPopupContextService.메인_팝업을_수정한다.mockResolvedValue(
        updatedPopup,
      );

      // When
      const result = await service.메인_팝업을_수정한다(
        popupId,
        translations,
        'category-1',
        updatedBy,
        undefined,
      );

      // Then
      expect(storageService.deleteFiles).toHaveBeenCalledWith([
        'https://s3.aws.com/old-popup.jpg',
      ]);
      expect(storageService.uploadFiles).not.toHaveBeenCalled();
      expect(
        mainPopupContextService.메인_팝업_파일을_수정한다,
      ).toHaveBeenCalledWith(popupId, [], updatedBy);
      expect(result).toEqual(updatedPopup);
    });

    it('카테고리와 함께 메인 팝업을 수정해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const translations = [
        {
          languageId: 'lang-ko',
          title: '수정된 제목',
        },
      ];
      const updatedBy = 'user-1';
      const categoryId = 'category-1';

      const existingPopup = {
        id: popupId,
        isPublic: true,
        categoryId,
        attachments: [],
      } as Partial<MainPopup> as MainPopup;

      const updatedPopup = {
        ...existingPopup,
        categoryId,
      } as MainPopup;

      mockMainPopupContextService.메인_팝업_상세를_조회한다.mockResolvedValue(
        existingPopup,
      );
      mockMainPopupContextService.메인_팝업_파일을_수정한다.mockResolvedValue(
        existingPopup,
      );
      mockMainPopupContextService.메인_팝업을_수정한다.mockResolvedValue(
        updatedPopup,
      );

      // When
      const result = await service.메인_팝업을_수정한다(
        popupId,
        translations,
        categoryId,
        updatedBy,
        undefined,
      );

      // Then
      expect(mainPopupContextService.메인_팝업을_수정한다).toHaveBeenCalledWith(
        popupId,
        {
          translations,
          categoryId,
          updatedBy,
        },
      );
      expect(result).toEqual(updatedPopup);
    });
  });

  describe('메인_팝업_오더를_일괄_수정한다', () => {
    it('메인 팝업 오더를 일괄 수정해야 한다', async () => {
      // Given
      const popups = [
        { id: 'popup-1', order: 2 },
        { id: 'popup-2', order: 1 },
        { id: 'popup-3', order: 0 },
      ];
      const updatedBy = 'user-1';

      const mockResult = {
        success: true,
        updatedCount: 3,
      };

      mockMainPopupContextService.메인_팝업_오더를_일괄_수정한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.메인_팝업_오더를_일괄_수정한다(
        popups,
        updatedBy,
      );

      // Then
      expect(
        mainPopupContextService.메인_팝업_오더를_일괄_수정한다,
      ).toHaveBeenCalledWith(popups, updatedBy);
      expect(result).toEqual(mockResult);
    });
  });

  describe('메인_팝업_목록을_조회한다', () => {
    it('페이징된 목록을 조회하고 DTO로 변환해야 한다', async () => {
      // Given
      const mockPopups = [
        {
          id: 'popup-1',
          isPublic: true,
          order: 0,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          translations: [
            {
              language: { code: 'ko' },
              title: '메인 팝업 1',
              description: '설명 1',
            },
          ],
          category: {
            name: '공지사항',
          },
        } as any as MainPopup,
        {
          id: 'popup-2',
          isPublic: false,
          order: 1,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-04'),
          translations: [
            {
              language: { code: 'en' },
              title: 'Main Popup 2',
              description: 'Description 2',
            },
          ],
          category: {
            name: '이벤트',
          },
        } as any as MainPopup,
      ];

      const contextResult = {
        items: mockPopups,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockMainPopupContextService.메인_팝업_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      const result = await service.메인_팝업_목록을_조회한다(true, 'order', 1, 10);

      // Then
      expect(
        mainPopupContextService.메인_팝업_목록을_조회한다,
      ).toHaveBeenCalledWith(true, 'order', 1, 10, undefined, undefined);
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        id: 'popup-1',
        isPublic: true,
        order: 0,
        title: '메인 팝업 1',
        description: '설명 1',
        categoryName: '공지사항',
      });
    });

    it('한국어 번역이 없으면 첫 번째 번역을 사용해야 한다', async () => {
      // Given
      const mockPopups = [
        {
          id: 'popup-1',
          isPublic: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          translations: [
            {
              language: { code: 'en' },
              title: 'Main Popup',
              description: 'Description',
            },
          ],
        } as any as MainPopup,
      ];

      const contextResult = {
        items: mockPopups,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockMainPopupContextService.메인_팝업_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      const result = await service.메인_팝업_목록을_조회한다();

      // Then
      expect(result.items[0].title).toBe('Main Popup');
      expect(result.items[0].description).toBe('Description');
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
        totalPages: 0,
      };

      mockMainPopupContextService.메인_팝업_목록을_조회한다.mockResolvedValue(
        contextResult,
      );

      // When
      await service.메인_팝업_목록을_조회한다(
        true,
        'createdAt',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(
        mainPopupContextService.메인_팝업_목록을_조회한다,
      ).toHaveBeenCalledWith(true, 'createdAt', 1, 10, startDate, endDate);
    });
  });

  describe('메인_팝업_카테고리_목록을_조회한다', () => {
    it('카테고리 목록을 조회해야 한다', async () => {
      // Given
      const mockCategories = [
        {
          id: 'cat-1',
          name: '카테고리 1',
          entityType: CategoryEntityType.MAIN_POPUP,
        } as Category,
        {
          id: 'cat-2',
          name: '카테고리 2',
          entityType: CategoryEntityType.MAIN_POPUP,
        } as Category,
      ];

      mockCategoryService.엔티티_타입별_카테고리를_조회한다.mockResolvedValue(
        mockCategories,
      );

      // When
      const result = await service.메인_팝업_카테고리_목록을_조회한다();

      // Then
      expect(
        categoryService.엔티티_타입별_카테고리를_조회한다,
      ).toHaveBeenCalledWith(CategoryEntityType.MAIN_POPUP, true);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('메인_팝업_카테고리를_생성한다', () => {
    it('카테고리를 생성해야 한다', async () => {
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
        entityType: CategoryEntityType.MAIN_POPUP,
      } as Category;

      mockCategoryService.카테고리를_생성한다.mockResolvedValue(mockCategory);

      // When
      const result = await service.메인_팝업_카테고리를_생성한다(data);

      // Then
      expect(categoryService.카테고리를_생성한다).toHaveBeenCalledWith({
        entityType: CategoryEntityType.MAIN_POPUP,
        name: data.name,
        description: data.description,
        isActive: true,
        order: 0,
        createdBy: data.createdBy,
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('메인_팝업_카테고리를_수정한다', () => {
    it('카테고리를 수정해야 한다', async () => {
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
      const result = await service.메인_팝업_카테고리를_수정한다(
        categoryId,
        data,
      );

      // Then
      expect(categoryService.카테고리를_업데이트한다).toHaveBeenCalledWith(
        categoryId,
        data,
      );
      expect(result).toEqual(mockCategory);
    });
  });

  describe('메인_팝업_카테고리_오더를_변경한다', () => {
    it('카테고리 오더를 변경해야 한다', async () => {
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
      const result = await service.메인_팝업_카테고리_오더를_변경한다(
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

  describe('메인_팝업_카테고리를_삭제한다', () => {
    it('카테고리를 삭제해야 한다', async () => {
      // Given
      const categoryId = 'cat-1';
      mockCategoryService.카테고리를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.메인_팝업_카테고리를_삭제한다(categoryId);

      // Then
      expect(categoryService.카테고리를_삭제한다).toHaveBeenCalledWith(
        categoryId,
      );
      expect(result).toBe(true);
    });
  });
});
