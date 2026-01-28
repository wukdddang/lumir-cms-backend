import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  CreateBrochureHandler,
  CreateBrochureCommand,
} from '@context/brochure-context/handlers/commands/create-brochure.handler';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { Language } from '@domain/common/language/language.entity';
import { BadRequestException } from '@nestjs/common';

describe('CreateBrochureHandler', () => {
  let handler: CreateBrochureHandler;
  let brochureService: jest.Mocked<BrochureService>;
  let languageService: jest.Mocked<LanguageService>;
  let translationRepository: jest.Mocked<Repository<BrochureTranslation>>;

  const mockBrochureService = {
    브로슈어를_생성한다: jest.fn(),
    다음_순서를_계산한다: jest.fn(),
  };

  const mockLanguageService = {
    ID로_언어를_조회한다: jest.fn(),
    모든_언어를_조회한다: jest.fn(),
  };

  const mockTranslationRepository = {
    create: jest.fn(),
    save: jest.fn(),
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
        CreateBrochureHandler,
        {
          provide: BrochureService,
          useValue: mockBrochureService,
        },
        {
          provide: LanguageService,
          useValue: mockLanguageService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(BrochureTranslation),
          useValue: mockTranslationRepository,
        },
      ],
    }).compile();

    handler = module.get<CreateBrochureHandler>(CreateBrochureHandler);
    brochureService = module.get(BrochureService);
    languageService = module.get(LanguageService);
    translationRepository = module.get(getRepositoryToken(BrochureTranslation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('브로슈어를 생성해야 한다', async () => {
      // Given
      const command = new CreateBrochureCommand({
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
            description: '루미르 회사 소개서',
          },
        ],
        categoryId: 'category-1',
        createdBy: 'user-1',
      });

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

      const mockBrochure = {
        id: 'brochure-1',
        isPublic: true,
        order: 0,
        attachments: null,
        createdAt: new Date(),
      } as any as Brochure;

      const mockTranslation = {
        id: 'translation-1',
        brochureId: 'brochure-1',
        languageId: 'language-1',
        title: '회사 소개 브로슈어',
        description: '루미르 회사 소개서',
        isSynced: false,
      } as any as BrochureTranslation;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(
        mockKoreanLanguage,
      );
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        mockKoreanLanguage,
        mockEnglishLanguage,
      ]);
      mockBrochureService.다음_순서를_계산한다.mockResolvedValue(0);
      mockBrochureService.브로슈어를_생성한다.mockResolvedValue(mockBrochure);
      mockTranslationRepository.create.mockReturnValue(mockTranslation);
      mockTranslationRepository.save.mockResolvedValue([mockTranslation]);

      // When
      const result = await handler.execute(command);

      // Then
      expect(languageService.ID로_언어를_조회한다).toHaveBeenCalledWith(
        'language-1',
      );
      expect(brochureService.다음_순서를_계산한다).toHaveBeenCalled();
      expect(brochureService.브로슈어를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: true,
          order: 0,
          createdBy: 'user-1',
        }),
      );
      expect(result).toMatchObject({
        id: 'brochure-1',
        isPublic: true,
        order: 0,
      });
    });

    it('첨부파일이 있는 브로슈어를 생성해야 한다', async () => {
      // Given
      const command = new CreateBrochureCommand({
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
          },
        ],
        categoryId: 'category-1',
        attachments: [
          {
            fileName: 'brochure.pdf',
            fileUrl: 'https://s3.aws.com/brochure.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'user-1',
      });

      const mockLanguage = {
        id: 'language-1',
        code: 'ko',
        name: '한국어',
      } as Language;

      const mockBrochure = {
        id: 'brochure-1',
        isPublic: true,
        order: 0,
        attachments: command.data.attachments,
        createdAt: new Date(),
      } as any as Brochure;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([mockLanguage]);
      mockBrochureService.다음_순서를_계산한다.mockResolvedValue(0);
      mockBrochureService.브로슈어를_생성한다.mockResolvedValue(mockBrochure);
      mockTranslationRepository.create.mockReturnValue({} as any);
      mockTranslationRepository.save.mockResolvedValue([]);

      // When
      const result = await handler.execute(command);

      // Then
      expect(brochureService.브로슈어를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: command.data.attachments,
        }),
      );
      expect(result.id).toBe('brochure-1');
    });

    it('여러 언어 번역으로 브로슈어를 생성해야 한다', async () => {
      // Given
      const command = new CreateBrochureCommand({
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
            description: '한국어 설명',
          },
          {
            languageId: 'language-2',
            title: 'Company Brochure',
            description: 'English description',
          },
        ],
        categoryId: 'category-1',
        createdBy: 'user-1',
      });

      const mockKoreanLanguage = {
        id: 'language-1',
        code: 'ko',
        name: '한국어',
      } as Language;

      const mockEnglishLanguage = {
        id: 'language-2',
        code: 'en',
        name: 'English',
      } as Language;

      const mockBrochure = {
        id: 'brochure-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      } as any as Brochure;

      mockLanguageService.ID로_언어를_조회한다
        .mockResolvedValueOnce(mockKoreanLanguage)
        .mockResolvedValueOnce(mockEnglishLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        mockKoreanLanguage,
        mockEnglishLanguage,
      ]);
      mockBrochureService.다음_순서를_계산한다.mockResolvedValue(0);
      mockBrochureService.브로슈어를_생성한다.mockResolvedValue(mockBrochure);
      mockTranslationRepository.create.mockReturnValue({} as any);
      mockTranslationRepository.save.mockResolvedValue([]);

      // When
      const result = await handler.execute(command);

      // Then
      expect(languageService.ID로_언어를_조회한다).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('brochure-1');
    });

    it('중복된 언어 ID가 있으면 BadRequestException을 던져야 한다', async () => {
      // Given
      const command = new CreateBrochureCommand({
        translations: [
          {
            languageId: 'language-1',
            title: '제목1',
          },
          {
            languageId: 'language-1', // 중복
            title: '제목2',
          },
        ],
        categoryId: 'category-1',
        createdBy: 'user-1',
      });

      const mockLanguage = {
        id: 'language-1',
        code: 'ko',
        name: '한국어',
      } as Language;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockLanguage);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        '중복된 언어 ID가 있습니다.',
      );
    });

    it('나머지 활성 언어에 대해 자동 동기화 번역을 생성해야 한다', async () => {
      // Given
      const command = new CreateBrochureCommand({
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
            description: '한국어 설명',
          },
        ],
        categoryId: 'category-1',
        createdBy: 'user-1',
      });

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

      const mockBrochure = {
        id: 'brochure-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      } as any as Brochure;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(
        mockKoreanLanguage,
      );
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([
        mockKoreanLanguage,
        mockEnglishLanguage,
        mockJapaneseLanguage,
      ]);
      mockBrochureService.다음_순서를_계산한다.mockResolvedValue(0);
      mockBrochureService.브로슈어를_생성한다.mockResolvedValue(mockBrochure);

      const mockCustomTranslation = {
        brochureId: 'brochure-1',
        languageId: 'language-1',
        isSynced: false,
      } as any as BrochureTranslation;

      const mockSyncedTranslation = {
        brochureId: 'brochure-1',
        languageId: 'language-2',
        isSynced: true,
      } as any as BrochureTranslation;

      mockTranslationRepository.create
        .mockReturnValueOnce(mockCustomTranslation)
        .mockReturnValueOnce(mockSyncedTranslation)
        .mockReturnValueOnce(mockSyncedTranslation);

      mockTranslationRepository.save.mockResolvedValue([]);

      // When
      await handler.execute(command);

      // Then
      // 첫 번째 save: 개별 설정 번역 (isSynced: false)
      // 두 번째 save: 자동 동기화 번역 (isSynced: true) - English, Japanese
      expect(translationRepository.save).toHaveBeenCalledTimes(2);
      expect(translationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          brochureId: 'brochure-1',
          languageId: 'language-1',
          isSynced: false,
        }),
      );
    });

    it('order를 자동으로 계산해야 한다', async () => {
      // Given
      const command = new CreateBrochureCommand({
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
          },
        ],
        categoryId: 'category-1',
        createdBy: 'user-1',
      });

      const mockLanguage = {
        id: 'language-1',
        code: 'ko',
        name: '한국어',
      } as Language;

      const mockBrochure = {
        id: 'brochure-1',
        isPublic: true,
        order: 5, // 계산된 order
        createdAt: new Date(),
      } as any as Brochure;

      mockLanguageService.ID로_언어를_조회한다.mockResolvedValue(mockLanguage);
      mockLanguageService.모든_언어를_조회한다.mockResolvedValue([mockLanguage]);
      mockBrochureService.다음_순서를_계산한다.mockResolvedValue(5);
      mockBrochureService.브로슈어를_생성한다.mockResolvedValue(mockBrochure);
      mockTranslationRepository.create.mockReturnValue({} as any);
      mockTranslationRepository.save.mockResolvedValue([]);

      // When
      const result = await handler.execute(command);

      // Then
      expect(brochureService.다음_순서를_계산한다).toHaveBeenCalled();
      expect(brochureService.브로슈어를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 5,
        }),
      );
      expect(result.order).toBe(5);
    });

    it('categoryId가 없으면 BadRequestException을 던져야 한다', async () => {
      // Given
      const command = new CreateBrochureCommand({
        translations: [
          {
            languageId: 'language-1',
            title: '회사 소개 브로슈어',
          },
        ],
        categoryId: '' as any, // 빈 문자열
        createdBy: 'user-1',
      });

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'categoryId는 필수입니다.',
      );
    });
  });
});
