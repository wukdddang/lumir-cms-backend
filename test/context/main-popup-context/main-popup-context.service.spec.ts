import { Test, TestingModule } from '@nestjs/testing';
import { MainPopupContextService } from '@context/main-popup-context/main-popup-context.service';
import { MainPopupService } from '@domain/sub/main-popup/main-popup.service';
import { LanguageService } from '@domain/common/language/language.service';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import { MainPopupTranslation } from '@domain/sub/main-popup/main-popup-translation.entity';
import { Language } from '@domain/common/language/language.entity';
import { BadRequestException } from '@nestjs/common';

describe('MainPopupContextService', () => {
  let service: MainPopupContextService;
  let mainPopupService: jest.Mocked<MainPopupService>;
  let languageService: jest.Mocked<LanguageService>;

  const mockMainPopupService = {
    메인_팝업을_생성한다: jest.fn(),
    메인_팝업을_업데이트한다: jest.fn(),
    메인_팝업을_삭제한다: jest.fn(),
    ID로_메인_팝업을_조회한다: jest.fn(),
    모든_메인_팝업을_조회한다: jest.fn(),
    메인_팝업_공개_여부를_변경한다: jest.fn(),
    다음_순서를_계산한다: jest.fn(),
    메인_팝업_번역을_조회한다: jest.fn(),
    메인_팝업_번역을_생성한다: jest.fn(),
    메인_팝업_번역을_업데이트한다: jest.fn(),
    메인_팝업_오더를_일괄_업데이트한다: jest.fn(),
    공개된_메인_팝업을_조회한다: jest.fn(),
  };

  const mockLanguageService = {
    ID로_언어를_조회한다: jest.fn(),
    모든_언어를_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MainPopupContextService,
        {
          provide: MainPopupService,
          useValue: mockMainPopupService,
        },
        {
          provide: LanguageService,
          useValue: mockLanguageService,
        },
      ],
    }).compile();

    service = module.get<MainPopupContextService>(MainPopupContextService);
    mainPopupService = module.get(MainPopupService);
    languageService = module.get(LanguageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('메인_팝업_전체_목록을_조회한다', () => {
    it('전체 목록을 조회해야 한다', async () => {
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

      mockMainPopupService.모든_메인_팝업을_조회한다.mockResolvedValue(
        mockPopups,
      );

      // When
      const result = await service.메인_팝업_전체_목록을_조회한다();

      // Then
      expect(mainPopupService.모든_메인_팝업을_조회한다).toHaveBeenCalledWith({
        orderBy: 'order',
      });
      expect(result).toEqual(mockPopups);
    });
  });

  describe('메인_팝업_상세를_조회한다', () => {
    it('메인 팝업 상세를 조회해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const mockPopup = {
        id: popupId,
        isPublic: true,
        translations: [],
      } as any as MainPopup;

      mockMainPopupService.ID로_메인_팝업을_조회한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업_상세를_조회한다(popupId);

      // Then
      expect(mainPopupService.ID로_메인_팝업을_조회한다).toHaveBeenCalledWith(
        popupId,
      );
      expect(result).toEqual(mockPopup);
    });
  });

  describe('메인_팝업을_삭제한다', () => {
    it('메인 팝업을 삭제해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      mockMainPopupService.메인_팝업을_삭제한다.mockResolvedValue(true);

      // When
      const result = await service.메인_팝업을_삭제한다(popupId);

      // Then
      expect(mainPopupService.메인_팝업을_삭제한다).toHaveBeenCalledWith(
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

      mockMainPopupService.메인_팝업_공개_여부를_변경한다.mockResolvedValue(
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
        mainPopupService.메인_팝업_공개_여부를_변경한다,
      ).toHaveBeenCalledWith(popupId, isPublic, updatedBy);
      expect(result).toEqual(mockPopup);
    });
  });

  describe('메인_팝업_파일을_수정한다', () => {
    it('메인 팝업 파일을 수정해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const attachments = [
        {
          fileName: 'popup.jpg',
          fileUrl: 'https://s3.aws.com/popup.jpg',
          fileSize: 1024000,
          mimeType: 'image/jpeg',
        },
      ];
      const updatedBy = 'user-1';

      const mockPopup = {
        id: popupId,
        attachments,
      } as MainPopup;

      mockMainPopupService.메인_팝업을_업데이트한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업_파일을_수정한다(
        popupId,
        attachments,
        updatedBy,
      );

      // Then
      expect(mainPopupService.메인_팝업을_업데이트한다).toHaveBeenCalledWith(
        popupId,
        {
          attachments,
          updatedBy,
        },
      );
      expect(result).toEqual(mockPopup);
    });
  });

  describe('메인_팝업을_생성한다', () => {
    it('메인 팝업을 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'lang-ko',
          title: '메인 팝업 제목',
          description: '메인 팝업 설명',
        },
      ];
      const createdBy = 'user-1';

      const koreanLang = {
        id: 'lang-ko',
        code: 'ko',
        name: '한국어',
      } as Language;

      const englishLang = {
        id: 'lang-en',
        code: 'en',
        name: 'English',
      } as Language;

      const mockPopup = {
        id: 'popup-1',
        isPublic: true,
        order: 0,
        translations: [],
      } as Partial<MainPopup> as MainPopup;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(koreanLang);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        koreanLang,
        englishLang,
      ]);
      mockMainPopupService.다음_순서를_계산한다.mockResolvedValue(0);
      mockMainPopupService.메인_팝업을_생성한다.mockResolvedValue(mockPopup);
      mockMainPopupService.메인_팝업_번역을_생성한다.mockResolvedValue(
        undefined,
      );
      mockMainPopupService.ID로_메인_팝업을_조회한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_생성한다(translations, createdBy);

      // Then
      expect(languageService.ID로_언어를_조회한다).toHaveBeenCalledWith(
        'lang-ko',
      );
      expect(mainPopupService.다음_순서를_계산한다).toHaveBeenCalled();
      expect(mainPopupService.메인_팝업을_생성한다).toHaveBeenCalledWith({
        isPublic: true,
        order: 0,
        attachments: null,
        createdBy,
      });
      // 개별 설정된 번역 (isSynced: false)
      expect(mainPopupService.메인_팝업_번역을_생성한다).toHaveBeenCalledWith(
        'popup-1',
        [
          {
            languageId: 'lang-ko',
            title: '메인 팝업 제목',
            description: '메인 팝업 설명',
            isSynced: false,
          },
        ],
        createdBy,
      );
      // 자동 동기화 번역 (isSynced: true)
      expect(mainPopupService.메인_팝업_번역을_생성한다).toHaveBeenCalledWith(
        'popup-1',
        [
          {
            languageId: 'lang-en',
            title: '메인 팝업 제목',
            description: '메인 팝업 설명',
            isSynced: true,
          },
        ],
        createdBy,
      );
      expect(result).toEqual(mockPopup);
    });

    it('첨부파일과 함께 메인 팝업을 생성해야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'lang-ko',
          title: '메인 팝업',
          description: '설명',
        },
      ];
      const createdBy = 'user-1';
      const attachments = [
        {
          fileName: 'popup.jpg',
          fileUrl: 'https://s3.aws.com/popup.jpg',
          fileSize: 1024000,
          mimeType: 'image/jpeg',
        },
      ];

      const koreanLang = {
        id: 'lang-ko',
        code: 'ko',
        name: '한국어',
      } as Language;

      const mockPopup = {
        id: 'popup-1',
        isPublic: true,
        order: 0,
        attachments,
      } as MainPopup;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(koreanLang);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([koreanLang]);
      mockMainPopupService.다음_순서를_계산한다.mockResolvedValue(0);
      mockMainPopupService.메인_팝업을_생성한다.mockResolvedValue(mockPopup);
      mockMainPopupService.메인_팝업_번역을_생성한다.mockResolvedValue(
        undefined,
      );
      mockMainPopupService.ID로_메인_팝업을_조회한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_생성한다(
        translations,
        createdBy,
        attachments,
      );

      // Then
      expect(mainPopupService.메인_팝업을_생성한다).toHaveBeenCalledWith({
        isPublic: true,
        order: 0,
        attachments,
        createdBy,
      });
      expect(result.attachments).toEqual(attachments);
    });

    it('중복된 언어 ID로 생성 시 BadRequestException을 던져야 한다', async () => {
      // Given
      const translations = [
        {
          languageId: 'lang-ko',
          title: '제목 1',
        },
        {
          languageId: 'lang-ko', // 중복
          title: '제목 2',
        },
      ];

      const koreanLang = {
        id: 'lang-ko',
        code: 'ko',
        name: '한국어',
      } as Language;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(koreanLang);

      // When & Then
      await expect(
        service.메인_팝업을_생성한다(translations, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('메인_팝업을_수정한다', () => {
    it('메인 팝업을 수정해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const data = {
        isPublic: false,
        order: 5,
        updatedBy: 'user-1',
      };

      const mockPopup = {
        id: popupId,
        ...data,
      } as MainPopup;

      mockMainPopupService.메인_팝업을_업데이트한다.mockResolvedValue(
        mockPopup,
      );
      mockMainPopupService.ID로_메인_팝업을_조회한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_수정한다(popupId, data);

      // Then
      expect(mainPopupService.메인_팝업을_업데이트한다).toHaveBeenCalledWith(
        popupId,
        {
          isPublic: false,
          order: 5,
          updatedBy: 'user-1',
        },
      );
      expect(result).toEqual(mockPopup);
    });

    it('번역과 함께 메인 팝업을 수정해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const data = {
        translations: [
          {
            languageId: 'lang-ko',
            title: '수정된 제목',
            description: '수정된 설명',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockPopup = {
        id: popupId,
        translations: [],
      } as Partial<MainPopup> as MainPopup;

      const existingTranslations = [
        {
          id: 'trans-1',
          languageId: 'lang-ko',
          title: '기존 제목',
        } as MainPopupTranslation,
      ];

      mockMainPopupService.메인_팝업_번역을_조회한다.mockResolvedValue(
        existingTranslations,
      );
      mockMainPopupService.메인_팝업_번역을_업데이트한다.mockResolvedValue(
        undefined,
      );
      mockMainPopupService.ID로_메인_팝업을_조회한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_수정한다(popupId, data);

      // Then
      expect(mainPopupService.메인_팝업_번역을_조회한다).toHaveBeenCalledWith(
        popupId,
      );
      expect(
        mainPopupService.메인_팝업_번역을_업데이트한다,
      ).toHaveBeenCalledWith('trans-1', {
        title: '수정된 제목',
        description: '수정된 설명',
        isSynced: false,
        updatedBy: 'user-1',
      });
      expect(result).toEqual(mockPopup);
    });

    it('새로운 언어로 번역을 생성해야 한다', async () => {
      // Given
      const popupId = 'popup-1';
      const data = {
        translations: [
          {
            languageId: 'lang-en', // 새 언어
            title: 'New Title',
            description: 'New Description',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockPopup = {
        id: popupId,
        translations: [],
      } as Partial<MainPopup> as MainPopup;

      const existingTranslations = [
        {
          id: 'trans-1',
          languageId: 'lang-ko', // 다른 언어만 존재
          title: '기존 제목',
        } as MainPopupTranslation,
      ];

      mockMainPopupService.메인_팝업_번역을_조회한다.mockResolvedValue(
        existingTranslations,
      );
      mockMainPopupService.메인_팝업_번역을_생성한다.mockResolvedValue(
        undefined,
      );
      mockMainPopupService.ID로_메인_팝업을_조회한다.mockResolvedValue(
        mockPopup,
      );

      // When
      const result = await service.메인_팝업을_수정한다(popupId, data);

      // Then
      expect(mainPopupService.메인_팝업_번역을_생성한다).toHaveBeenCalledWith(
        popupId,
        [
          {
            languageId: 'lang-en',
            title: 'New Title',
            description: 'New Description',
            isSynced: false,
          },
        ],
        'user-1',
      );
      expect(result).toEqual(mockPopup);
    });
  });

  describe('메인_팝업_오더를_일괄_수정한다', () => {
    it('메인 팝업 오더를 일괄 수정해야 한다', async () => {
      // Given
      const items = [
        { id: 'popup-1', order: 2 },
        { id: 'popup-2', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockResult = {
        success: true,
        updatedCount: 2,
      };

      mockMainPopupService.메인_팝업_오더를_일괄_업데이트한다.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.메인_팝업_오더를_일괄_수정한다(
        items,
        updatedBy,
      );

      // Then
      expect(
        mainPopupService.메인_팝업_오더를_일괄_업데이트한다,
      ).toHaveBeenCalledWith(items, updatedBy);
      expect(result).toEqual(mockResult);
    });
  });

  describe('메인_팝업_목록을_조회한다', () => {
    it('페이징된 메인 팝업 목록을 조회해야 한다', async () => {
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

      mockMainPopupService.모든_메인_팝업을_조회한다.mockResolvedValue(
        mockPopups,
      );

      // When
      const result = await service.메인_팝업_목록을_조회한다(true, 'order', 1, 10);

      // Then
      expect(mainPopupService.모든_메인_팝업을_조회한다).toHaveBeenCalledWith({
        isPublic: true,
        orderBy: 'order',
        startDate: undefined,
        endDate: undefined,
      });
      expect(result.items).toEqual(mockPopups);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('날짜 범위로 필터링된 목록을 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockPopups = [] as MainPopup[];

      mockMainPopupService.모든_메인_팝업을_조회한다.mockResolvedValue(
        mockPopups,
      );

      // When
      const result = await service.메인_팝업_목록을_조회한다(
        undefined,
        'createdAt',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(mainPopupService.모든_메인_팝업을_조회한다).toHaveBeenCalledWith({
        isPublic: undefined,
        orderBy: 'createdAt',
        startDate,
        endDate,
      });
    });

    it('페이징 계산이 정확해야 한다', async () => {
      // Given
      const mockPopups = Array.from({ length: 25 }, (_, i) => ({
        id: `popup-${i + 1}`,
        isPublic: true,
        order: i,
      })) as MainPopup[];

      mockMainPopupService.모든_메인_팝업을_조회한다.mockResolvedValue(
        mockPopups,
      );

      // When
      const result = await service.메인_팝업_목록을_조회한다(
        undefined,
        'order',
        2,
        10,
      );

      // Then
      expect(result.items.length).toBe(10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.items[0].id).toBe('popup-11'); // 두 번째 페이지 첫 항목
    });
  });
});
