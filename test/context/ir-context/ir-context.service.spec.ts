import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { IRContextService } from '@context/ir-context/ir-context.service';
import { IRService } from '@domain/core/ir/ir.service';
import { LanguageService } from '@domain/common/language/language.service';
import { CategoryService } from '@domain/common/category/category.service';
import { IR } from '@domain/core/ir/ir.entity';
import { IRTranslation } from '@domain/core/ir/ir-translation.entity';
import { Language } from '@domain/common/language/language.entity';
import { BadRequestException } from '@nestjs/common';

describe('IRContextService', () => {
  let service: IRContextService;
  let irService: jest.Mocked<IRService>;
  let languageService: jest.Mocked<LanguageService>;

  const mockIRService = {
    IR을_생성한다: jest.fn(),
    IR을_업데이트한다: jest.fn(),
    IR을_삭제한다: jest.fn(),
    ID로_IR을_조회한다: jest.fn(),
    모든_IR을_조회한다: jest.fn(),
    IR_공개_여부를_변경한다: jest.fn(),
    다음_순서를_계산한다: jest.fn(),
    IR_번역을_조회한다: jest.fn(),
    IR_번역을_생성한다: jest.fn(),
    IR_번역을_업데이트한다: jest.fn(),
    IR_오더를_일괄_업데이트한다: jest.fn(),
    공개된_IR을_조회한다: jest.fn(),
  };

  const mockLanguageService = {
    ID로_언어를_조회한다: jest.fn(),
    모든_언어를_조회한다: jest.fn(),
    기본_언어를_조회한다: jest.fn(),
  };

  const mockCategoryService = {
    ID로_카테고리를_조회한다: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'DEFAULT_LANGUAGE_CODE') return 'en';
      return defaultValue;
    }),
  };

  const mockEventBus = {
    publish: jest.fn(),
    publishAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IRContextService,
        {
          provide: IRService,
          useValue: mockIRService,
        },
        {
          provide: LanguageService,
          useValue: mockLanguageService,
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
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<IRContextService>(IRContextService);
    irService = module.get(IRService);
    languageService = module.get(LanguageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IR_전체_목록을_조회한다', () => {
    it('전체 목록을 조회해야 한다', async () => {
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

      mockIRService.모든_IR을_조회한다.mockResolvedValue(mockIRs);

      // When
      const result = await service.IR_전체_목록을_조회한다();

      // Then
      expect(irService.모든_IR을_조회한다).toHaveBeenCalledWith({
        orderBy: 'order',
      });
      expect(result).toEqual(mockIRs);
    });
  });

  describe('IR_상세를_조회한다', () => {
    it('IR 상세를 조회해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const mockIR = {
        id: irId,
        isPublic: true,
        translations: [],
      } as any as IR;

      mockIRService.ID로_IR을_조회한다.mockResolvedValue(mockIR);

      // When
      const result = await service.IR_상세를_조회한다(irId);

      // Then
      expect(irService.ID로_IR을_조회한다).toHaveBeenCalledWith(irId);
      expect(result).toEqual(mockIR);
    });
  });

  describe('IR을_삭제한다', () => {
    it('IR을 삭제해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      mockIRService.IR을_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.IR을_삭제한다(irId);

      // Then
      expect(irService.IR을_삭제한다).toHaveBeenCalledWith(irId);
      expect(result).toBe(true);
    });
  });

  describe('IR_공개를_수정한다', () => {
    it('공개 여부를 수정해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockIR = {
        id: irId,
        isPublic,
      } as IR;

      mockIRService.IR_공개_여부를_변경한다.mockResolvedValue(mockIR);

      // When
      const result = await service.IR_공개를_수정한다(
        irId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(irService.IR_공개_여부를_변경한다).toHaveBeenCalledWith(
        irId,
        isPublic,
        updatedBy,
      );
      expect(result).toEqual(mockIR);
    });
  });

  describe('IR_파일을_수정한다', () => {
    it('IR 파일을 수정해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const attachments = [
        {
          fileName: 'new-file.pdf',
          fileUrl: 'https://s3.aws.com/new-file.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      ];
      const updatedBy = 'user-1';

      const mockIR = {
        id: irId,
        attachments,
      } as any as IR;

      mockIRService.IR을_업데이트한다.mockResolvedValue(mockIR);

      // When
      const result = await service.IR_파일을_수정한다(
        irId,
        attachments,
        updatedBy,
      );

      // Then
      expect(irService.IR을_업데이트한다).toHaveBeenCalledWith(irId, {
        attachments,
        updatedBy,
      });
      expect(result).toEqual(mockIR);
    });
  });

  describe('IR을_생성한다', () => {
    it('다국어 번역과 함께 IR을 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '2024년 1분기 IR 자료',
          description: '2024년 1분기 IR 자료',
        },
      ];
      const createdBy = 'user-1';
      const attachments = [
        {
          fileName: 'ir.pdf',
          fileUrl: 'https://s3.aws.com/ir.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        },
      ];

      const mockKoreanLanguage = {
        id: 'language-1',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const mockEnglishLanguage = {
        id: 'language-2',
        code: 'en',
        name: 'English',
        isActive: true,
      } as Language;

      const mockIR = {
        id: 'ir-1',
        isPublic: true,
        order: 0,
        attachments,
      } as any as IR;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockKoreanLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        mockKoreanLanguage,
        mockEnglishLanguage,
      ]);
      mockIRService.다음_순서를_계산한다.mockResolvedValue(0);
      mockIRService.IR을_생성한다.mockResolvedValue(mockIR);
      mockIRService.IR_번역을_생성한다.mockResolvedValue(undefined);
      mockIRService.ID로_IR을_조회한다.mockResolvedValue(mockIR);

      // Given - 카테고리 mock
      const categoryId = 'category-1';
      mockCategoryService.ID로_카테고리를_조회한다.mockResolvedValue({ id: categoryId } as any);

      // When
      const result = await service.IR을_생성한다(translations, createdBy, attachments, categoryId);

      // Then
      expect(languageService.ID로_언어를_조회한다).toHaveBeenCalledWith('language-1');
      expect(languageService.모든_언어를_조회한다).toHaveBeenCalledWith(false);
      expect(irService.다음_순서를_계산한다).toHaveBeenCalled();
      expect(irService.IR을_생성한다).toHaveBeenCalledWith({
        isPublic: true,
        order: 0,
        categoryId,
        attachments,
        createdBy,
      });
      expect(irService.IR_번역을_생성한다).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockIR);
    });

    it('중복된 언어 ID가 있으면 BadRequestException을 던져야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '제목1',
        },
        {
          languageId: 'language-1',
          title: '제목2',
        },
      ];
      const categoryId = 'category-1';

      const mockLanguage = {
        id: 'language-1',
        code: 'ko',
      } as Language;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockLanguage);

      // When & Then
      await expect(service.IR을_생성한다(translations, undefined, undefined, categoryId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.IR을_생성한다(translations, undefined, undefined, categoryId)).rejects.toThrow(
        '중복된 언어 ID가 있습니다.',
      );
    });

    it('categoryId가 제공되면 카테고리를 검증하고 IR 엔티티에 저장해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: 'IR 제목',
        },
      ];
      const createdBy = 'user-1';
      const categoryId = 'category-1';

      const mockLanguage = {
        id: 'language-1',
        code: 'ko',
      } as Language;

      const mockIR = {
        id: 'ir-1',
        isPublic: true,
        order: 0,
        categoryId, // IR 엔티티에 직접 저장됨
      } as any as IR;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([mockLanguage]);
      mockCategoryService.ID로_카테고리를_조회한다.mockResolvedValue({ id: categoryId });
      mockIRService.다음_순서를_계산한다.mockResolvedValue(0);
      mockIRService.IR을_생성한다.mockResolvedValue(mockIR);
      mockIRService.IR_번역을_생성한다.mockResolvedValue(undefined);
      mockIRService.ID로_IR을_조회한다.mockResolvedValue(mockIR);

      // When
      const result = await service.IR을_생성한다(translations, createdBy, undefined, categoryId);

      // Then
      expect(mockCategoryService.ID로_카테고리를_조회한다).toHaveBeenCalledWith(categoryId);
      expect(irService.IR을_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId,
        }),
      );
      expect(result.categoryId).toBe(categoryId);
    });

    it('기준 번역으로 나머지 언어를 자동 동기화해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: 'IR 제목',
          description: '설명',
        },
      ];
      const categoryId = 'category-1';

      const mockKoreanLanguage = {
        id: 'language-1',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const mockEnglishLanguage = {
        id: 'language-2',
        code: 'en',
        name: 'English',
        isActive: true,
      } as Language;

      const mockJapaneseLanguage = {
        id: 'language-3',
        code: 'ja',
        name: '日本語',
        isActive: true,
      } as Language;

      const mockIR = {
        id: 'ir-1',
        isPublic: true,
        order: 0,
      } as any as IR;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockKoreanLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        mockKoreanLanguage,
        mockEnglishLanguage,
        mockJapaneseLanguage,
      ]);
      mockCategoryService.ID로_카테고리를_조회한다.mockResolvedValue({ id: categoryId } as any);
      mockIRService.다음_순서를_계산한다.mockResolvedValue(0);
      mockIRService.IR을_생성한다.mockResolvedValue(mockIR);
      mockIRService.IR_번역을_생성한다.mockResolvedValue(undefined);
      mockIRService.ID로_IR을_조회한다.mockResolvedValue(mockIR);

      // When
      await service.IR을_생성한다(translations, undefined, undefined, categoryId);

      // Then
      // 첫 번째 호출: 수동 입력 번역 (isSynced: false)
      expect(irService.IR_번역을_생성한다).toHaveBeenNthCalledWith(
        1,
        'ir-1',
        [
          expect.objectContaining({
            languageId: 'language-1',
            title: 'IR 제목',
            isSynced: false,
          }),
        ],
        undefined,
      );

      // 두 번째 호출: 자동 동기화 번역 (isSynced: true)
      expect(irService.IR_번역을_생성한다).toHaveBeenNthCalledWith(
        2,
        'ir-1',
        expect.arrayContaining([
          expect.objectContaining({
            languageId: 'language-2',
            title: 'IR 제목',
            isSynced: true,
          }),
          expect.objectContaining({
            languageId: 'language-3',
            title: 'IR 제목',
            isSynced: true,
          }),
        ]),
        undefined,
      );
    });
  });

  describe('IR을_수정한다', () => {
    it('IR의 번역을 수정해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const data = {
        translations: [
          {
            id: 'translation-1',
            languageId: 'language-1',
            title: '수정된 제목',
            description: '수정된 설명',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockIR = {
        id: irId,
        isPublic: true,
        translations: [],
      } as any as IR;

      mockIRService.IR을_업데이트한다.mockResolvedValue(mockIR);
      mockIRService.IR_번역을_업데이트한다.mockResolvedValue(undefined);
      mockIRService.ID로_IR을_조회한다.mockResolvedValue(mockIR);

      // When
      const result = await service.IR을_수정한다(irId, data);

      // Then
      expect(irService.IR_번역을_업데이트한다).toHaveBeenCalledWith('translation-1', {
        title: '수정된 제목',
        description: '수정된 설명',
        isSynced: false,
        updatedBy: 'user-1',
      });
      expect(result).toEqual(mockIR);
    });

    it('새로운 번역을 추가해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const data = {
        translations: [
          {
            languageId: 'language-2',
            title: '새 번역',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockIR = {
        id: irId,
        isPublic: true,
      } as any as IR;

      mockIRService.IR_번역을_조회한다.mockResolvedValue([]);
      mockIRService.IR을_업데이트한다.mockResolvedValue(mockIR);
      mockIRService.IR_번역을_생성한다.mockResolvedValue(undefined);
      mockIRService.ID로_IR을_조회한다.mockResolvedValue(mockIR);

      // When
      await service.IR을_수정한다(irId, data);

      // Then
      expect(irService.IR_번역을_생성한다).toHaveBeenCalledWith(
        irId,
        [
          {
            languageId: 'language-2',
            title: '새 번역',
            description: undefined,
            isSynced: false,
          },
        ],
        'user-1',
      );
    });

    it('기존 번역이 있으면 업데이트해야 한다', async () => {
      // Given
      const irId = 'ir-1';
      const data = {
        translations: [
          {
            languageId: 'language-1',
            title: '수정된 제목',
          },
        ],
        updatedBy: 'user-1',
      };

      const existingTranslation = {
        id: 'translation-1',
        languageId: 'language-1',
        title: '기존 제목',
      } as IRTranslation;

      const mockIR = {
        id: irId,
        isPublic: true,
      } as any as IR;

      mockIRService.IR_번역을_조회한다.mockResolvedValue([
        existingTranslation,
      ]);
      mockIRService.IR을_업데이트한다.mockResolvedValue(mockIR);
      mockIRService.IR_번역을_업데이트한다.mockResolvedValue(undefined);
      mockIRService.ID로_IR을_조회한다.mockResolvedValue(mockIR);

      // When
      await service.IR을_수정한다(irId, data);

      // Then
      expect(irService.IR_번역을_업데이트한다).toHaveBeenCalledWith('translation-1', {
        title: '수정된 제목',
        description: undefined,
        isSynced: false,
        updatedBy: 'user-1',
      });
    });
  });

  describe('IR_오더를_일괄_수정한다', () => {
    it('여러 IR의 순서를 일괄 수정해야 한다', async () => {
      // Given
      const items = [
        { id: 'ir-1', order: 0 },
        { id: 'ir-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = {
        success: true,
        updatedCount: 2,
      };

      mockIRService.IR_오더를_일괄_업데이트한다.mockResolvedValue(mockResult);

      // When
      const result = await service.IR_오더를_일괄_수정한다(items, updatedBy);

      // Then
      expect(irService.IR_오더를_일괄_업데이트한다).toHaveBeenCalledWith(
        items,
        updatedBy,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('IR_목록을_조회한다', () => {
    it('페이징 처리된 목록을 조회해야 한다', async () => {
      // Given
      const isPublic = true;
      const orderBy = 'order' as const;
      const page = 1;
      const limit = 10;

      const mockIRs = [
        {
          id: 'ir-1',
          isPublic: true,
          translations: [
            {
              language: { code: 'ko' },
              title: 'IR 제목',
            },
          ],
          category: {
            name: '재무정보',
          },
        } as any,
      ];

      mockIRService.모든_IR을_조회한다.mockResolvedValue(mockIRs);

      // When
      const result = await service.IR_목록을_조회한다(
        isPublic,
        orderBy,
        page,
        limit,
      );

      // Then
      expect(irService.모든_IR을_조회한다).toHaveBeenCalledWith({
        isPublic,
        orderBy,
        startDate: undefined,
        endDate: undefined,
      });
      expect(result.items).toEqual(mockIRs);
      expect(result.total).toBe(1);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.totalPages).toBe(1);
    });

    it('날짜 필터를 적용해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockIRService.모든_IR을_조회한다.mockResolvedValue([]);

      // When
      await service.IR_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(irService.모든_IR을_조회한다).toHaveBeenCalledWith({
        isPublic: undefined,
        orderBy: 'order',
        startDate,
        endDate,
      });
    });

    it('페이지 계산이 정확해야 한다', async () => {
      // Given
      const mockIRs = Array.from({ length: 25 }, (_, i) => ({
        id: `ir-${i}`,
        isPublic: true,
        translations: [{ language: { code: 'ko' }, title: `제목 ${i}` }],
        category: { name: '재무정보' },
      })) as any;

      mockIRService.모든_IR을_조회한다.mockResolvedValue(mockIRs);

      // When
      const result = await service.IR_목록을_조회한다(undefined, 'order', 2, 10);

      // Then
      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
    });
  });
});
