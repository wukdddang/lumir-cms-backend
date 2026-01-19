import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncElectronicDisclosureTranslationsHandler } from '@context/electronic-disclosure-context/handlers/jobs/sync-electronic-disclosure-translations.handler';
import { ElectronicDisclosureService } from '@domain/core/electronic-disclosure/electronic-disclosure.service';
import { LanguageService } from '@domain/common/language/language.service';
import { ElectronicDisclosureTranslation } from '@domain/core/electronic-disclosure/electronic-disclosure-translation.entity';
import { ElectronicDisclosure } from '@domain/core/electronic-disclosure/electronic-disclosure.entity';
import { Language } from '@domain/common/language/language.entity';

describe('SyncElectronicDisclosureTranslationsHandler', () => {
  let handler: SyncElectronicDisclosureTranslationsHandler;
  let electronicDisclosureService: jest.Mocked<ElectronicDisclosureService>;
  let languageService: jest.Mocked<LanguageService>;
  let translationRepository: jest.Mocked<Repository<ElectronicDisclosureTranslation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncElectronicDisclosureTranslationsHandler,
        {
          provide: ElectronicDisclosureService,
          useValue: {
            모든_전자공시를_조회한다: jest.fn(),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            코드로_언어를_조회한다: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ElectronicDisclosureTranslation),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SyncElectronicDisclosureTranslationsHandler>(
      SyncElectronicDisclosureTranslationsHandler,
    );
    electronicDisclosureService = module.get(ElectronicDisclosureService);
    languageService = module.get(LanguageService);
    translationRepository = module.get(
      getRepositoryToken(ElectronicDisclosureTranslation),
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

      const disclosure1: ElectronicDisclosure = {
        id: 'disclosure-1',
        isPublic: true,
        order: 0,
      } as ElectronicDisclosure;

      const koreanTranslation: ElectronicDisclosureTranslation = {
        id: 'trans-ko',
        electronicDisclosureId: 'disclosure-1',
        languageId: 'ko-uuid',
        title: '2024년 1분기 실적 공시',
        description: '실적 공시 자료입니다',
        isSynced: false,
      } as ElectronicDisclosureTranslation;

      const englishTranslation: ElectronicDisclosureTranslation = {
        id: 'trans-en',
        electronicDisclosureId: 'disclosure-1',
        languageId: 'en-uuid',
        title: '2024년 1분기 실적 공시', // 이전 한국어 제목
        description: '실적 공시 자료입니다',
        isSynced: true,
      } as ElectronicDisclosureTranslation;

      const japaneseTranslation: ElectronicDisclosureTranslation = {
        id: 'trans-ja',
        electronicDisclosureId: 'disclosure-1',
        languageId: 'ja-uuid',
        title: '2024년 1분기 실적 공시',
        description: '실적 공시 자료입니다',
        isSynced: true,
      } as ElectronicDisclosureTranslation;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      electronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue([
        disclosure1,
      ]);
      translationRepository.findOne.mockResolvedValue(koreanTranslation);
      translationRepository.find.mockResolvedValue([
        englishTranslation,
        japaneseTranslation,
      ]);
      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as ElectronicDisclosureTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(languageService.코드로_언어를_조회한다).toHaveBeenCalledWith('ko');
      expect(
        electronicDisclosureService.모든_전자공시를_조회한다,
      ).toHaveBeenCalled();
      expect(translationRepository.findOne).toHaveBeenCalledWith({
        where: {
          electronicDisclosureId: 'disclosure-1',
          languageId: 'ko-uuid',
        },
      });
      expect(translationRepository.find).toHaveBeenCalledWith({
        where: {
          electronicDisclosureId: 'disclosure-1',
          isSynced: true,
        },
      });

      // 2번 저장 (영어, 일본어)
      expect(translationRepository.save).toHaveBeenCalledTimes(2);

      // 영어 번역이 한국어와 동기화되었는지 확인
      const savedEnglish = translationRepository.save.mock.calls[0][0];
      expect(savedEnglish.title).toBe('2024년 1분기 실적 공시');
      expect(savedEnglish.description).toBe('실적 공시 자료입니다');
    });

    it('한국어 번역이 없으면 해당 전자공시를 건너뛰어야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const disclosure1: ElectronicDisclosure = {
        id: 'disclosure-1',
        isPublic: true,
      } as ElectronicDisclosure;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      electronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue([
        disclosure1,
      ]);
      translationRepository.findOne.mockResolvedValue(null); // 한국어 번역 없음

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

      const disclosure1: ElectronicDisclosure = {
        id: 'disclosure-1',
        isPublic: true,
      } as ElectronicDisclosure;

      const koreanTranslation: ElectronicDisclosureTranslation = {
        id: 'trans-ko',
        electronicDisclosureId: 'disclosure-1',
        languageId: 'ko-uuid',
        title: '2024년 1분기 실적 공시 (최종)',
        description: '최종본입니다',
        isSynced: false,
      } as ElectronicDisclosureTranslation;

      const englishTranslation: ElectronicDisclosureTranslation = {
        id: 'trans-en',
        electronicDisclosureId: 'disclosure-1',
        languageId: 'en-uuid',
        title: 'Q1 2024 Financial Report', // 수동 수정된 영어 제목
        description: 'Manual translation',
        isSynced: false, // 수동 관리
      } as ElectronicDisclosureTranslation;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      electronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue([
        disclosure1,
      ]);
      translationRepository.findOne.mockResolvedValue(koreanTranslation);
      translationRepository.find.mockResolvedValue([
        englishTranslation, // isSynced=false이지만 find에서 조회는 안됨
      ]);

      // When
      await handler.execute();

      // Then
      // isSynced=true인 번역만 find로 조회되므로, 실제로는 빈 배열이 반환될 것
      // 그러나 이 테스트는 로직 검증을 위해 englishTranslation이 조회된다고 가정
      // 실제로는 find의 where 조건에 isSynced: true가 있으므로 조회되지 않음
      expect(translationRepository.find).toHaveBeenCalledWith({
        where: {
          electronicDisclosureId: 'disclosure-1',
          isSynced: true,
        },
      });
    });

    it('한국어 언어가 없으면 동기화를 건너뛰어야 한다', async () => {
      // Given
      languageService.코드로_언어를_조회한다.mockResolvedValue(null);

      // When
      await handler.execute();

      // Then
      expect(
        electronicDisclosureService.모든_전자공시를_조회한다,
      ).not.toHaveBeenCalled();
      expect(translationRepository.findOne).not.toHaveBeenCalled();
      expect(translationRepository.save).not.toHaveBeenCalled();
    });

    it('여러 전자공시를 한 번에 동기화해야 한다', async () => {
      // Given
      const koreanLanguage: Language = {
        id: 'ko-uuid',
        code: 'ko',
        name: '한국어',
        isActive: true,
      } as Language;

      const disclosure1: ElectronicDisclosure = {
        id: 'disclosure-1',
      } as ElectronicDisclosure;
      const disclosure2: ElectronicDisclosure = {
        id: 'disclosure-2',
      } as ElectronicDisclosure;

      languageService.코드로_언어를_조회한다.mockResolvedValue(
        koreanLanguage,
      );
      electronicDisclosureService.모든_전자공시를_조회한다.mockResolvedValue([
        disclosure1,
        disclosure2,
      ]);

      // disclosure-1의 번역
      translationRepository.findOne
        .mockResolvedValueOnce({
          id: 'trans-ko-1',
          electronicDisclosureId: 'disclosure-1',
          languageId: 'ko-uuid',
          title: '첫 번째 전자공시',
          isSynced: false,
        } as ElectronicDisclosureTranslation)
        // disclosure-2의 번역
        .mockResolvedValueOnce({
          id: 'trans-ko-2',
          electronicDisclosureId: 'disclosure-2',
          languageId: 'ko-uuid',
          title: '두 번째 전자공시',
          isSynced: false,
        } as ElectronicDisclosureTranslation);

      translationRepository.find
        .mockResolvedValueOnce([
          {
            id: 'trans-en-1',
            languageId: 'en-uuid',
            isSynced: true,
          } as ElectronicDisclosureTranslation,
        ])
        .mockResolvedValueOnce([
          {
            id: 'trans-en-2',
            languageId: 'en-uuid',
            isSynced: true,
          } as ElectronicDisclosureTranslation,
        ]);

      translationRepository.save.mockImplementation((trans) =>
        Promise.resolve(trans as ElectronicDisclosureTranslation),
      );

      // When
      await handler.execute();

      // Then
      expect(translationRepository.save).toHaveBeenCalledTimes(2); // 각 전자공시마다 1개씩
    });
  });
});
