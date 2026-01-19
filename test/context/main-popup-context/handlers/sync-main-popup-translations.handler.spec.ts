import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncMainPopupTranslationsHandler } from '@context/main-popup-context/handlers/jobs/sync-main-popup-translations.handler';
import { MainPopupService } from '@domain/sub/main-popup/main-popup.service';
import { LanguageService } from '@domain/common/language/language.service';
import { MainPopupTranslation } from '@domain/sub/main-popup/main-popup-translation.entity';
import { MainPopup } from '@domain/sub/main-popup/main-popup.entity';
import { Language } from '@domain/common/language/language.entity';

describe('SyncMainPopupTranslationsHandler', () => {
  let handler: SyncMainPopupTranslationsHandler;
  let mainPopupService: jest.Mocked<MainPopupService>;
  let languageService: jest.Mocked<LanguageService>;
  let translationRepository: jest.Mocked<Repository<MainPopupTranslation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncMainPopupTranslationsHandler,
        {
          provide: MainPopupService,
          useValue: {
            모든_메인_팝업을_조회한다: jest.fn(),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            코드로_언어를_조회한다: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MainPopupTranslation),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SyncMainPopupTranslationsHandler>(
      SyncMainPopupTranslationsHandler,
    );
    mainPopupService = module.get(MainPopupService);
    languageService = module.get(LanguageService);
    translationRepository = module.get(
      getRepositoryToken(MainPopupTranslation),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('한국어 원본과 isSynced=true인 번역들을 동기화해야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const popup1: MainPopup = {
        id: 'popup-1',
        isPublic: true,
        order: 0,
      } as MainPopup;

      const koreanTranslation: MainPopupTranslation = {
        id: 'trans-ko',
        mainPopupId: 'popup-1',
        languageId: 'ko-uuid',
        title: '신규 서비스 오픈 안내',
        description: '새로운 서비스가 오픈되었습니다',
        isSynced: false,
      } as MainPopupTranslation;

      const englishTranslation: MainPopupTranslation = {
        id: 'trans-en',
        mainPopupId: 'popup-1',
        languageId: 'en-uuid',
        title: '구 제목',
        description: '구 설명',
        isSynced: true,
      } as MainPopupTranslation;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      mainPopupService.모든_메인_팝업을_조회한다.mockResolvedValue([popup1]);
      translationRepository.findOne.mockResolvedValue(koreanTranslation);
      translationRepository.find.mockResolvedValue([englishTranslation]);
      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as MainPopupTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(languageService.코드로_언어를_조회한다).toHaveBeenCalledWith('ko');
      expect(mainPopupService.모든_메인_팝업을_조회한다).toHaveBeenCalled();
      expect(translationRepository.save).toHaveBeenCalledTimes(1);

      const savedTranslation = translationRepository.save.mock.calls[0][0];
      expect(savedTranslation.title).toBe('신규 서비스 오픈 안내');
      expect(savedTranslation.description).toBe(
        '새로운 서비스가 오픈되었습니다',
      );
    });

    it('한국어 번역이 없으면 해당 팝업을 건너뛰어야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const popup1: MainPopup = {
        id: 'popup-1',
        isPublic: true,
      } as MainPopup;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      mainPopupService.모든_메인_팝업을_조회한다.mockResolvedValue([popup1]);
      translationRepository.findOne.mockResolvedValue(null);

      // When
      await handler.execute();

      // Then
      expect(translationRepository.find).not.toHaveBeenCalled();
      expect(translationRepository.save).not.toHaveBeenCalled();
    });

    it('한국어 언어가 없으면 동기화를 건너뛰어야 한다', async () => {
      // Given
      languageService.코드로_언어를_조회한다.mockResolvedValue(null);

      // When
      await handler.execute();

      // Then
      expect(mainPopupService.모든_메인_팝업을_조회한다).not.toHaveBeenCalled();
      expect(translationRepository.findOne).not.toHaveBeenCalled();
      expect(translationRepository.save).not.toHaveBeenCalled();
    });

    it('여러 팝업을 한 번에 동기화해야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const popup1: MainPopup = { id: 'popup-1' } as MainPopup;
      const popup2: MainPopup = { id: 'popup-2' } as MainPopup;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      mainPopupService.모든_메인_팝업을_조회한다.mockResolvedValue([
        popup1,
        popup2,
      ]);

      translationRepository.findOne
        .mockResolvedValueOnce({
          id: 'trans-ko-1',
          mainPopupId: 'popup-1',
          languageId: 'ko-uuid',
          title: '첫 번째 팝업',
          isSynced: false,
        } as MainPopupTranslation)
        .mockResolvedValueOnce({
          id: 'trans-ko-2',
          mainPopupId: 'popup-2',
          languageId: 'ko-uuid',
          title: '두 번째 팝업',
          isSynced: false,
        } as MainPopupTranslation);

      translationRepository.find
        .mockResolvedValueOnce([
          {
            id: 'trans-en-1',
            languageId: 'en-uuid',
            isSynced: true,
          } as MainPopupTranslation,
        ])
        .mockResolvedValueOnce([
          {
            id: 'trans-en-2',
            languageId: 'en-uuid',
            isSynced: true,
          } as MainPopupTranslation,
        ]);

      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as MainPopupTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(translationRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
