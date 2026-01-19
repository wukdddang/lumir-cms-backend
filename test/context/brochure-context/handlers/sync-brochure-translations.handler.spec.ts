import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncBrochureTranslationsHandler } from '@context/brochure-context/handlers/jobs/sync-brochure-translations.handler';
import { BrochureService } from '@domain/core/brochure/brochure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { Language } from '@domain/common/language/language.entity';

describe('SyncBrochureTranslationsHandler', () => {
  let handler: SyncBrochureTranslationsHandler;
  let brochureService: jest.Mocked<BrochureService>;
  let languageService: jest.Mocked<LanguageService>;
  let translationRepository: jest.Mocked<Repository<BrochureTranslation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncBrochureTranslationsHandler,
        {
          provide: BrochureService,
          useValue: {
            모든_브로슈어를_조회한다: jest.fn(),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            코드로_언어를_조회한다: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BrochureTranslation),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SyncBrochureTranslationsHandler>(
      SyncBrochureTranslationsHandler,
    );
    brochureService = module.get(BrochureService);
    languageService = module.get(LanguageService);
    translationRepository = module.get(getRepositoryToken(BrochureTranslation));
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

      const brochure1: Brochure = {
        id: 'brochure-1',
        isPublic: true,
        order: 0,
      } as Brochure;

      const koreanTranslation: BrochureTranslation = {
        id: 'trans-ko',
        brochureId: 'brochure-1',
        languageId: 'ko-uuid',
        title: '회사 소개 브로슈어',
        description: '루미르 회사 소개 자료입니다',
        isSynced: true, // 브로슈어는 한국어도 true (원본이지만 스케줄러에서 제외)
      } as BrochureTranslation;

      const englishTranslation: BrochureTranslation = {
        id: 'trans-en',
        brochureId: 'brochure-1',
        languageId: 'en-uuid',
        title: '구 제목',
        description: '구 설명',
        isSynced: true,
      } as BrochureTranslation;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      brochureService.모든_브로슈어를_조회한다.mockResolvedValue([brochure1]);
      translationRepository.findOne.mockResolvedValue(koreanTranslation);
      translationRepository.find.mockResolvedValue([
        koreanTranslation,
        englishTranslation,
      ]);
      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as BrochureTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(languageService.코드로_언어를_조회한다).toHaveBeenCalledWith('ko');
      expect(brochureService.모든_브로슈어를_조회한다).toHaveBeenCalled();

      // 1번 저장 (영어만, 한국어는 제외)
      expect(translationRepository.save).toHaveBeenCalledTimes(1);

      const savedTranslation = translationRepository.save.mock.calls[0][0];
      expect(savedTranslation.title).toBe('회사 소개 브로슈어');
      expect(savedTranslation.description).toBe('루미르 회사 소개 자료입니다');
    });

    it('한국어 번역이 없으면 해당 브로슈어를 건너뛰어야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const brochure1: Brochure = {
        id: 'brochure-1',
        isPublic: true,
      } as Brochure;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      brochureService.모든_브로슈어를_조회한다.mockResolvedValue([brochure1]);
      translationRepository.findOne.mockResolvedValue(null);

      // When
      await handler.execute();

      // Then
      expect(translationRepository.find).not.toHaveBeenCalled();
      expect(translationRepository.save).not.toHaveBeenCalled();
    });

    it('isSynced=false인 번역은 동기화하지 않아야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const brochure1: Brochure = {
        id: 'brochure-1',
        isPublic: true,
      } as Brochure;

      const koreanTranslation: BrochureTranslation = {
        id: 'trans-ko',
        brochureId: 'brochure-1',
        languageId: 'ko-uuid',
        title: '회사 소개 브로슈어 (최종)',
        description: '최종본입니다',
        isSynced: true,
      } as BrochureTranslation;

      const englishTranslation: BrochureTranslation = {
        id: 'trans-en',
        brochureId: 'brochure-1',
        languageId: 'en-uuid',
        title: 'Company Brochure', // 수동 수정된 영어 제목
        description: 'Manual translation',
        isSynced: false, // 수동 관리
      } as BrochureTranslation;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      brochureService.모든_브로슈어를_조회한다.mockResolvedValue([brochure1]);
      translationRepository.findOne.mockResolvedValue(koreanTranslation);
      translationRepository.find.mockResolvedValue([koreanTranslation]); // isSynced=true인 번역만 조회됨

      // When
      await handler.execute();

      // Then
      // 한국어를 제외한 isSynced=true 번역이 없으므로 저장되지 않음
      expect(translationRepository.save).not.toHaveBeenCalled();
    });

    it('한국어 언어가 없으면 동기화를 건너뛰어야 한다', async () => {
      // Given
      languageService.코드로_언어를_조회한다.mockResolvedValue(null);

      // When
      await handler.execute();

      // Then
      expect(brochureService.모든_브로슈어를_조회한다).not.toHaveBeenCalled();
      expect(translationRepository.findOne).not.toHaveBeenCalled();
      expect(translationRepository.save).not.toHaveBeenCalled();
    });

    it('여러 브로슈어를 한 번에 동기화해야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const brochure1: Brochure = { id: 'brochure-1' } as Brochure;
      const brochure2: Brochure = { id: 'brochure-2' } as Brochure;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      brochureService.모든_브로슈어를_조회한다.mockResolvedValue([
        brochure1,
        brochure2,
      ]);

      translationRepository.findOne
        .mockResolvedValueOnce({
          id: 'trans-ko-1',
          brochureId: 'brochure-1',
          languageId: 'ko-uuid',
          title: '첫 번째 브로슈어',
          isSynced: true,
        } as BrochureTranslation)
        .mockResolvedValueOnce({
          id: 'trans-ko-2',
          brochureId: 'brochure-2',
          languageId: 'ko-uuid',
          title: '두 번째 브로슈어',
          isSynced: true,
        } as BrochureTranslation);

      translationRepository.find
        .mockResolvedValueOnce([
          {
            id: 'trans-en-1',
            languageId: 'en-uuid',
            isSynced: true,
          } as BrochureTranslation,
        ])
        .mockResolvedValueOnce([
          {
            id: 'trans-en-2',
            languageId: 'en-uuid',
            isSynced: true,
          } as BrochureTranslation,
        ]);

      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as BrochureTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(translationRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
