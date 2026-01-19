import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncIRTranslationsHandler } from '@context/ir-context/handlers/jobs/sync-ir-translations.handler';
import { IRService } from '@domain/core/ir/ir.service';
import { LanguageService } from '@domain/common/language/language.service';
import { IRTranslation } from '@domain/core/ir/ir-translation.entity';
import { IR } from '@domain/core/ir/ir.entity';
import { Language } from '@domain/common/language/language.entity';

describe('SyncIRTranslationsHandler', () => {
  let handler: SyncIRTranslationsHandler;
  let irService: jest.Mocked<IRService>;
  let languageService: jest.Mocked<LanguageService>;
  let translationRepository: jest.Mocked<Repository<IRTranslation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncIRTranslationsHandler,
        {
          provide: IRService,
          useValue: {
            모든_IR을_조회한다: jest.fn(),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            코드로_언어를_조회한다: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IRTranslation),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SyncIRTranslationsHandler>(SyncIRTranslationsHandler);
    irService = module.get(IRService);
    languageService = module.get(LanguageService);
    translationRepository = module.get(getRepositoryToken(IRTranslation));
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

      const ir1: IR = {
        id: 'ir-1',
        isPublic: true,
        order: 0,
      } as IR;

      const koreanTranslation: IRTranslation = {
        id: 'trans-ko',
        irId: 'ir-1',
        languageId: 'ko-uuid',
        title: '2024년 1분기 IR 자료',
        description: 'IR 자료입니다',
        isSynced: false,
      } as IRTranslation;

      const englishTranslation: IRTranslation = {
        id: 'trans-en',
        irId: 'ir-1',
        languageId: 'en-uuid',
        title: '구 제목',
        description: '구 설명',
        isSynced: true,
      } as IRTranslation;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      irService.모든_IR을_조회한다.mockResolvedValue([ir1]);
      translationRepository.findOne.mockResolvedValue(koreanTranslation);
      translationRepository.find.mockResolvedValue([englishTranslation]);
      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as IRTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(languageService.코드로_언어를_조회한다).toHaveBeenCalledWith('ko');
      expect(irService.모든_IR을_조회한다).toHaveBeenCalled();
      expect(translationRepository.save).toHaveBeenCalledTimes(1);

      const savedTranslation = translationRepository.save.mock.calls[0][0];
      expect(savedTranslation.title).toBe('2024년 1분기 IR 자료');
      expect(savedTranslation.description).toBe('IR 자료입니다');
    });

    it('한국어 번역이 없으면 해당 IR을 건너뛰어야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const ir1: IR = { id: 'ir-1', isPublic: true } as IR;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      irService.모든_IR을_조회한다.mockResolvedValue([ir1]);
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
      expect(irService.모든_IR을_조회한다).not.toHaveBeenCalled();
      expect(translationRepository.findOne).not.toHaveBeenCalled();
      expect(translationRepository.save).not.toHaveBeenCalled();
    });

    it('여러 IR을 한 번에 동기화해야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const ir1: IR = { id: 'ir-1' } as IR;
      const ir2: IR = { id: 'ir-2' } as IR;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      irService.모든_IR을_조회한다.mockResolvedValue([ir1, ir2]);

      translationRepository.findOne
        .mockResolvedValueOnce({
          id: 'trans-ko-1',
          irId: 'ir-1',
          languageId: 'ko-uuid',
          title: '첫 번째 IR',
          isSynced: false,
        } as IRTranslation)
        .mockResolvedValueOnce({
          id: 'trans-ko-2',
          irId: 'ir-2',
          languageId: 'ko-uuid',
          title: '두 번째 IR',
          isSynced: false,
        } as IRTranslation);

      translationRepository.find
        .mockResolvedValueOnce([
          {
            id: 'trans-en-1',
            languageId: 'en-uuid',
            isSynced: true,
          } as IRTranslation,
        ])
        .mockResolvedValueOnce([
          {
            id: 'trans-en-2',
            languageId: 'en-uuid',
            isSynced: true,
          } as IRTranslation,
        ]);

      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as IRTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(translationRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
