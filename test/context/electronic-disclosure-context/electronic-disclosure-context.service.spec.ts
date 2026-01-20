import { Test, TestingModule } from '@nestjs/testing';
import { ElectronicDisclosureContextService } from '@context/electronic-disclosure-context/electronic-disclosure-context.service';
import { ElectronicDisclosureService } from '@domain/core/electronic-disclosure/electronic-disclosure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';
import { Language } from '@domain/common/language/language.entity';
import { BadRequestException } from '@nestjs/common';

describe('ElectronicDisclosureContextService', () => {
  let service: ElectronicDisclosureContextService;
  let electronicDisclosureService: jest.Mocked<ElectronicDisclosureService>;
  let languageService: jest.Mocked<LanguageService>;

  const mockElectronicDisclosureService = {
    전자공시를_생성한다: jest.fn(),
    전자공시를_업데이트한다: jest.fn(),
    전자공시를_삭제한다: jest.fn(),
    ID로_전자공시를_조회한다: jest.fn(),
    모든_전자공시를_조회한다: jest.fn(),
    전자공시_공개_여부를_변경한다: jest.fn(),
    다음_순서를_계산한다: jest.fn(),
    전자공시_번역을_조회한다: jest.fn(),
    전자공시_번역을_생성한다: jest.fn(),
    전자공시_번역을_업데이트한다: jest.fn(),
    전자공시_오더를_일괄_업데이트한다: jest.fn(),
    공개된_전자공시를_조회한다: jest.fn(),
  };

  const mockLanguageService = {
    ID로_언어를_조회한다: jest.fn(),
    모든_언어를_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectronicDisclosureContextService,
        {
          provide: ElectronicDisclosureService,
          useValue: mockElectronicDisclosureService,
        },
        {
          provide: LanguageService,
          useValue: mockLanguageService,
        },
      ],
    }).compile();

    service = module.get<ElectronicDisclosureContextService>(
      ElectronicDisclosureContextService,
    );
    electronicDisclosureService = module.get(ElectronicDisclosureService);
    languageService = module.get(LanguageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('전자공시_전체_목록을_조회한다', () => {
    it('전체 목록을 조회해야 한다', async () => {
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

      mockElectronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue(
        mockDisclosures,
      );

      // When
      const result = await service.전자공시_전체_목록을_조회한다();

      // Then
      expect(electronicDisclosureService.모든_전자공시를_조회한다).toHaveBeenCalledWith({
        orderBy: 'order',
      });
      expect(result).toEqual(mockDisclosures);
    });
  });

  describe('전자공시_상세를_조회한다', () => {
    it('전자공시 상세를 조회해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const mockDisclosure = {
        id: disclosureId,
        isPublic: true,
        translations: [],
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureService.ID로_전자공시를_조회한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시_상세를_조회한다(disclosureId);

      // Then
      expect(
        electronicDisclosureService.ID로_전자공시를_조회한다,
      ).toHaveBeenCalledWith(disclosureId);
      expect(result).toEqual(mockDisclosure);
    });
  });

  describe('전자공시를_삭제한다', () => {
    it('전자공시를 삭제해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      mockElectronicDisclosureService.전자공시를_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.전자공시를_삭제한다(disclosureId);

      // Then
      expect(electronicDisclosureService.전자공시를_삭제한다).toHaveBeenCalledWith(
        disclosureId,
      );
      expect(result).toBe(true);
    });
  });

  describe('전자공시_공개를_수정한다', () => {
    it('공개 여부를 수정해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockDisclosure = {
        id: disclosureId,
        isPublic,
      } as ElectronicDisclosure;

      mockElectronicDisclosureService.전자공시_공개_여부를_변경한다.mockResolvedValue(
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
        electronicDisclosureService.전자공시_공개_여부를_변경한다,
      ).toHaveBeenCalledWith(disclosureId, isPublic, updatedBy);
      expect(result).toEqual(mockDisclosure);
    });
  });

  describe('전자공시_파일을_수정한다', () => {
    it('전자공시 파일을 수정해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const attachments = [
        {
          fileName: 'new-file.pdf',
          fileUrl: 'https://s3.aws.com/new-file.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      ];
      const updatedBy = 'user-1';

      const mockDisclosure = {
        id: disclosureId,
        attachments,
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureService.전자공시를_업데이트한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시_파일을_수정한다(
        disclosureId,
        attachments,
        updatedBy,
      );

      // Then
      expect(electronicDisclosureService.전자공시를_업데이트한다).toHaveBeenCalledWith(
        disclosureId,
        {
          attachments,
          updatedBy,
        },
      );
      expect(result).toEqual(mockDisclosure);
    });
  });

  describe('전자공시를_생성한다', () => {
    it('다국어 번역과 함께 전자공시를 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '2024년 1분기 실적 공시',
          description: '2024년 1분기 실적 공시 자료',
        },
      ];
      const createdBy = 'user-1';
      const attachments = [
        {
          fileName: 'disclosure.pdf',
          fileUrl: 'https://s3.aws.com/disclosure.pdf',
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

      const mockDisclosure = {
        id: 'disclosure-1',
        isPublic: true,
        order: 0,
        attachments,
      } as any as ElectronicDisclosure;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockKoreanLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        mockKoreanLanguage,
        mockEnglishLanguage,
      ]);
      mockElectronicDisclosureService.다음_순서를_계산한다.mockResolvedValue(0);
      mockElectronicDisclosureService.전자공시를_생성한다.mockResolvedValue(
        mockDisclosure,
      );
      mockElectronicDisclosureService.전자공시_번역을_생성한다.mockResolvedValue(
        undefined,
      );
      mockElectronicDisclosureService.ID로_전자공시를_조회한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시를_생성한다(translations, createdBy, attachments);

      // Then
      expect(languageService.ID로_언어를_조회한다).toHaveBeenCalledWith('language-1');
      expect(languageService.모든_언어를_조회한다).toHaveBeenCalledWith(false);
      expect(electronicDisclosureService.다음_순서를_계산한다).toHaveBeenCalled();
      expect(electronicDisclosureService.전자공시를_생성한다).toHaveBeenCalledWith({
        isPublic: true,
        order: 0,
        attachments,
        createdBy,
      });
      expect(electronicDisclosureService.전자공시_번역을_생성한다).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockDisclosure);
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

      const mockLanguage = {
        id: 'language-1',
        code: 'ko',
      } as Language;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockLanguage);

      // When & Then
      await expect(service.전자공시를_생성한다(translations)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.전자공시를_생성한다(translations)).rejects.toThrow(
        '중복된 언어 ID가 있습니다.',
      );
    });

    it('기준 번역으로 나머지 언어를 자동 동기화해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'language-1',
          title: '전자공시 제목',
          description: '설명',
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

      const mockJapaneseLanguage = {
        id: 'language-3',
        code: 'ja',
        name: '日本語',
        isActive: true,
      } as Language;

      const mockDisclosure = {
        id: 'disclosure-1',
        isPublic: true,
        order: 0,
      } as any as ElectronicDisclosure;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockKoreanLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        mockKoreanLanguage,
        mockEnglishLanguage,
        mockJapaneseLanguage,
      ]);
      mockElectronicDisclosureService.다음_순서를_계산한다.mockResolvedValue(0);
      mockElectronicDisclosureService.전자공시를_생성한다.mockResolvedValue(
        mockDisclosure,
      );
      mockElectronicDisclosureService.전자공시_번역을_생성한다.mockResolvedValue(
        undefined,
      );
      mockElectronicDisclosureService.ID로_전자공시를_조회한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      await service.전자공시를_생성한다(translations);

      // Then
      // 첫 번째 호출: 수동 입력 번역 (isSynced: false)
      expect(electronicDisclosureService.전자공시_번역을_생성한다).toHaveBeenNthCalledWith(
        1,
        'disclosure-1',
        [
          expect.objectContaining({
            languageId: 'language-1',
            title: '전자공시 제목',
            isSynced: false,
          }),
        ],
        undefined,
      );

      // 두 번째 호출: 자동 동기화 번역 (isSynced: true)
      expect(electronicDisclosureService.전자공시_번역을_생성한다).toHaveBeenNthCalledWith(
        2,
        'disclosure-1',
        expect.arrayContaining([
          expect.objectContaining({
            languageId: 'language-2',
            title: '전자공시 제목',
            isSynced: true,
          }),
          expect.objectContaining({
            languageId: 'language-3',
            title: '전자공시 제목',
            isSynced: true,
          }),
        ]),
        undefined,
      );
    });
  });

  describe('전자공시를_수정한다', () => {
    it('전자공시의 번역을 수정해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
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

      const mockDisclosure = {
        id: disclosureId,
        isPublic: true,
        translations: [],
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureService.전자공시를_업데이트한다.mockResolvedValue(
        mockDisclosure,
      );
      mockElectronicDisclosureService.전자공시_번역을_업데이트한다.mockResolvedValue(
        undefined,
      );
      mockElectronicDisclosureService.ID로_전자공시를_조회한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      const result = await service.전자공시를_수정한다(disclosureId, data);

      // Then
      expect(
        electronicDisclosureService.전자공시_번역을_업데이트한다,
      ).toHaveBeenCalledWith('translation-1', {
        title: '수정된 제목',
        description: '수정된 설명',
        isSynced: false,
        updatedBy: 'user-1',
      });
      expect(result).toEqual(mockDisclosure);
    });

    it('새로운 번역을 추가해야 한다', async () => {
      // Given
      const disclosureId = 'disclosure-1';
      const data = {
        translations: [
          {
            languageId: 'language-2',
            title: '새 번역',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockDisclosure = {
        id: disclosureId,
        isPublic: true,
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureService.전자공시_번역을_조회한다.mockResolvedValue([]);
      mockElectronicDisclosureService.전자공시를_업데이트한다.mockResolvedValue(
        mockDisclosure,
      );
      mockElectronicDisclosureService.전자공시_번역을_생성한다.mockResolvedValue(
        undefined,
      );
      mockElectronicDisclosureService.ID로_전자공시를_조회한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      await service.전자공시를_수정한다(disclosureId, data);

      // Then
      expect(electronicDisclosureService.전자공시_번역을_생성한다).toHaveBeenCalledWith(
        disclosureId,
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
      const disclosureId = 'disclosure-1';
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
      } as ElectronicDisclosureTranslation;

      const mockDisclosure = {
        id: disclosureId,
        isPublic: true,
      } as any as ElectronicDisclosure;

      mockElectronicDisclosureService.전자공시_번역을_조회한다.mockResolvedValue([
        existingTranslation,
      ]);
      mockElectronicDisclosureService.전자공시를_업데이트한다.mockResolvedValue(
        mockDisclosure,
      );
      mockElectronicDisclosureService.전자공시_번역을_업데이트한다.mockResolvedValue(
        undefined,
      );
      mockElectronicDisclosureService.ID로_전자공시를_조회한다.mockResolvedValue(
        mockDisclosure,
      );

      // When
      await service.전자공시를_수정한다(disclosureId, data);

      // Then
      expect(
        electronicDisclosureService.전자공시_번역을_업데이트한다,
      ).toHaveBeenCalledWith('translation-1', {
        title: '수정된 제목',
        description: undefined,
        isSynced: false,
        updatedBy: 'user-1',
      });
    });
  });

  describe('전자공시_오더를_일괄_수정한다', () => {
    it('여러 전자공시의 순서를 일괄 수정해야 한다', async () => {
      // Given
      const items = [
        { id: 'disclosure-1', order: 0 },
        { id: 'disclosure-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = {
        success: true,
        updatedCount: 2,
      };

      mockElectronicDisclosureService.전자공시_오더를_일괄_업데이트한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.전자공시_오더를_일괄_수정한다(items, updatedBy);

      // Then
      expect(
        electronicDisclosureService.전자공시_오더를_일괄_업데이트한다,
      ).toHaveBeenCalledWith(items, updatedBy);
      expect(result).toEqual(mockResult);
    });
  });

  describe('전자공시_목록을_조회한다', () => {
    it('페이징 처리된 목록을 조회해야 한다', async () => {
      // Given
      const isPublic = true;
      const orderBy = 'order' as const;
      const page = 1;
      const limit = 10;

      const mockDisclosures = [
        {
          id: 'disclosure-1',
          isPublic: true,
          translations: [
            {
              language: { code: 'ko' },
              title: '전자공시 제목',
            },
          ],
        } as any,
      ];

      mockElectronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue(
        mockDisclosures,
      );

      // When
      const result = await service.전자공시_목록을_조회한다(
        isPublic,
        orderBy,
        page,
        limit,
      );

      // Then
      expect(electronicDisclosureService.모든_전자공시를_조회한다).toHaveBeenCalledWith({
        isPublic,
        orderBy,
        startDate: undefined,
        endDate: undefined,
      });
      expect(result.items).toEqual(mockDisclosures);
      expect(result.total).toBe(1);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.totalPages).toBe(1);
    });

    it('날짜 필터를 적용해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockElectronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue([]);

      // When
      await service.전자공시_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(electronicDisclosureService.모든_전자공시를_조회한다).toHaveBeenCalledWith({
        isPublic: undefined,
        orderBy: 'order',
        startDate,
        endDate,
      });
    });

    it('페이지 계산이 정확해야 한다', async () => {
      // Given
      const mockDisclosures = Array.from({ length: 25 }, (_, i) => ({
        id: `disclosure-${i}`,
        isPublic: true,
        translations: [{ language: { code: 'ko' }, title: `제목 ${i}` }],
      })) as any;

      mockElectronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue(
        mockDisclosures,
      );

      // When
      const result = await service.전자공시_목록을_조회한다(undefined, 'order', 2, 10);

      // Then
      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
    });
  });
});
