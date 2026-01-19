import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncShareholdersMeetingTranslationsHandler } from '@context/shareholders-meeting-context/handlers/jobs/sync-shareholders-meeting-translations.handler';
import { ShareholdersMeetingService } from '@domain/core/shareholders-meeting/shareholders-meeting.service';
import { LanguageService } from '@domain/common/language/language.service';
import { ShareholdersMeetingTranslation } from '@domain/core/shareholders-meeting/shareholders-meeting-translation.entity';
import { VoteResultTranslation } from '@domain/core/shareholders-meeting/vote-result-translation.entity';

/**
 * 주주총회 번역 동기화 핸들러 테스트
 *
 * isSynced가 true인 번역들을 한국어 원본과 동기화하는 핸들러를 테스트합니다.
 */
describe('SyncShareholdersMeetingTranslationsHandler', () => {
  let handler: SyncShareholdersMeetingTranslationsHandler;
  let shareholdersMeetingService: jest.Mocked<ShareholdersMeetingService>;
  let languageService: jest.Mocked<LanguageService>;
  let meetingTranslationRepository: jest.Mocked<
    Repository<ShareholdersMeetingTranslation>
  >;
  let voteResultTranslationRepository: jest.Mocked<
    Repository<VoteResultTranslation>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncShareholdersMeetingTranslationsHandler,
        {
          provide: ShareholdersMeetingService,
          useValue: {
            모든_주주총회를_조회한다: jest.fn(),
            의결_결과를_조회한다: jest.fn(),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            코드로_언어를_조회한다: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShareholdersMeetingTranslation),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(VoteResultTranslation),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SyncShareholdersMeetingTranslationsHandler>(
      SyncShareholdersMeetingTranslationsHandler,
    );
    shareholdersMeetingService = module.get(ShareholdersMeetingService);
    languageService = module.get(LanguageService);
    meetingTranslationRepository = module.get(
      getRepositoryToken(ShareholdersMeetingTranslation),
    );
    voteResultTranslationRepository = module.get(
      getRepositoryToken(VoteResultTranslation),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('한국어 원본과 isSynced=true인 주주총회 번역들을 동기화해야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting = {
        id: 'meeting-1',
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
      };

      const koreanTranslation = {
        id: 'trans-ko',
        shareholdersMeetingId: meeting.id,
        languageId: koreanLanguage.id,
        title: '제38기 정기 주주총회',
        description: '정기 주주총회 안내',
        content: '상세 내용',
        resultText: '의결 결과',
        summary: '요약',
        isSynced: false,
      };

      const englishTranslation = {
        id: 'trans-en',
        shareholdersMeetingId: meeting.id,
        languageId: 'en-id',
        title: '이전 제목',
        description: '이전 설명',
        content: '이전 내용',
        resultText: '이전 결과',
        summary: '이전 요약',
        isSynced: true, // 자동 동기화 대상
      };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting as any,
      ]);
      meetingTranslationRepository.findOne
        .mockResolvedValueOnce(koreanTranslation as any)
        .mockResolvedValueOnce(null);
      meetingTranslationRepository.find.mockResolvedValue([
        koreanTranslation as any,
        englishTranslation as any,
      ]);
      meetingTranslationRepository.save.mockResolvedValue(englishTranslation as any);
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([]);

      // When
      await handler.execute();

      // Then
      expect(languageService.코드로_언어를_조회한다).toHaveBeenCalledWith('ko');
      expect(shareholdersMeetingService.모든_주주총회를_조회한다).toHaveBeenCalled();
      expect(meetingTranslationRepository.findOne).toHaveBeenCalledWith({
        where: {
          shareholdersMeetingId: meeting.id,
          languageId: koreanLanguage.id,
        },
      });
      expect(meetingTranslationRepository.find).toHaveBeenCalledWith({
        where: {
          shareholdersMeetingId: meeting.id,
          isSynced: true,
        },
      });
      expect(meetingTranslationRepository.save).toHaveBeenCalled();
      
      // 동기화된 번역이 한국어 원본과 동일한지 확인
      const savedTranslation = meetingTranslationRepository.save.mock.calls[0][0];
      expect(savedTranslation.title).toBe(koreanTranslation.title);
      expect(savedTranslation.description).toBe(koreanTranslation.description);
      expect(savedTranslation.content).toBe(koreanTranslation.content);
      expect(savedTranslation.resultText).toBe(koreanTranslation.resultText);
      expect(savedTranslation.summary).toBe(koreanTranslation.summary);
    });

    it('한국어 원본과 isSynced=true인 의결 결과 번역들을 동기화해야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting = {
        id: 'meeting-1',
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
      };
      const voteResult = {
        id: 'vote-1',
        shareholdersMeetingId: meeting.id,
        agendaNumber: 1,
      };

      const koreanVoteResultTranslation = {
        id: 'vote-trans-ko',
        voteResultId: voteResult.id,
        languageId: koreanLanguage.id,
        title: '제1호 안건: 재무제표 승인',
        isSynced: false,
      };

      const englishVoteResultTranslation = {
        id: 'vote-trans-en',
        voteResultId: voteResult.id,
        languageId: 'en-id',
        title: '이전 안건 제목',
        isSynced: true, // 자동 동기화 대상
      };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting as any,
      ]);
      meetingTranslationRepository.findOne.mockResolvedValue({
        id: 'trans-ko',
        title: '주주총회 제목',
      } as any);
      meetingTranslationRepository.find.mockResolvedValue([]);
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([
        voteResult as any,
      ]);
      voteResultTranslationRepository.findOne
        .mockResolvedValueOnce(koreanVoteResultTranslation as any)
        .mockResolvedValueOnce(null);
      voteResultTranslationRepository.find.mockResolvedValue([
        koreanVoteResultTranslation as any,
        englishVoteResultTranslation as any,
      ]);
      voteResultTranslationRepository.save.mockResolvedValue(
        englishVoteResultTranslation as any,
      );

      // When
      await handler.execute();

      // Then
      expect(shareholdersMeetingService.의결_결과를_조회한다).toHaveBeenCalledWith(
        meeting.id,
      );
      expect(voteResultTranslationRepository.findOne).toHaveBeenCalledWith({
        where: {
          voteResultId: voteResult.id,
          languageId: koreanLanguage.id,
        },
      });
      expect(voteResultTranslationRepository.find).toHaveBeenCalledWith({
        where: {
          voteResultId: voteResult.id,
          isSynced: true,
        },
      });
      expect(voteResultTranslationRepository.save).toHaveBeenCalled();

      // 동기화된 번역이 한국어 원본과 동일한지 확인
      const savedTranslation = voteResultTranslationRepository.save.mock.calls[0][0];
      expect(savedTranslation.title).toBe(koreanVoteResultTranslation.title);
    });

    it('한국어 번역이 없으면 해당 주주총회를 건너뛰어야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting = {
        id: 'meeting-1',
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
      };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting as any,
      ]);
      meetingTranslationRepository.findOne.mockResolvedValue(null); // 한국어 번역 없음
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([]);

      // When
      await handler.execute();

      // Then
      expect(meetingTranslationRepository.find).not.toHaveBeenCalled(); // 동기화 건너뜀
      expect(meetingTranslationRepository.save).not.toHaveBeenCalled(); // 저장 안 함
    });

    it('한국어 언어가 없으면 동기화를 건너뛰어야 한다', async () => {
      // Given
      languageService.코드로_언어를_조회한다.mockResolvedValue(null as any);

      // When
      await handler.execute();

      // Then
      expect(shareholdersMeetingService.모든_주주총회를_조회한다).not.toHaveBeenCalled();
      expect(meetingTranslationRepository.findOne).not.toHaveBeenCalled();
      expect(meetingTranslationRepository.save).not.toHaveBeenCalled();
    });

    it('여러 주주총회와 의결 결과를 한 번에 동기화해야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting1 = { id: 'meeting-1', location: '서울', meetingDate: new Date() };
      const meeting2 = { id: 'meeting-2', location: '부산', meetingDate: new Date() };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting1 as any,
        meeting2 as any,
      ]);
      meetingTranslationRepository.findOne.mockResolvedValue({
        id: 'trans-ko',
        title: '주주총회',
      } as any);
      meetingTranslationRepository.find.mockResolvedValue([
        { id: 'trans-en', isSynced: true, languageId: 'en-id' } as any,
      ]);
      meetingTranslationRepository.save.mockResolvedValue({} as any);
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([]);

      // When
      await handler.execute();

      // Then
      expect(meetingTranslationRepository.findOne).toHaveBeenCalledTimes(2); // 2개 주주총회
      expect(meetingTranslationRepository.find).toHaveBeenCalledTimes(2);
      expect(meetingTranslationRepository.save).toHaveBeenCalledTimes(2);
    });

    it('주주총회 번역의 모든 필드(title, description, content, resultText, summary)를 동기화해야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting = { id: 'meeting-1', location: '서울', meetingDate: new Date() };

      const koreanTranslation = {
        id: 'trans-ko',
        shareholdersMeetingId: meeting.id,
        languageId: koreanLanguage.id,
        title: '한국어 제목',
        description: '한국어 설명',
        content: '한국어 내용',
        resultText: '한국어 의결 결과',
        summary: '한국어 요약',
        isSynced: false,
      };

      const syncedTranslation = {
        id: 'trans-en',
        shareholdersMeetingId: meeting.id,
        languageId: 'en-id',
        title: '이전 제목',
        description: '이전 설명',
        content: '이전 내용',
        resultText: '이전 결과',
        summary: '이전 요약',
        isSynced: true,
      };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting as any,
      ]);
      meetingTranslationRepository.findOne.mockResolvedValue(koreanTranslation as any);
      meetingTranslationRepository.find.mockResolvedValue([
        koreanTranslation as any,
        syncedTranslation as any,
      ]);
      meetingTranslationRepository.save.mockResolvedValue(syncedTranslation as any);
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([]);

      // When
      await handler.execute();

      // Then
      const savedTranslation = meetingTranslationRepository.save.mock.calls[0][0];
      expect(savedTranslation.title).toBe('한국어 제목');
      expect(savedTranslation.description).toBe('한국어 설명');
      expect(savedTranslation.content).toBe('한국어 내용');
      expect(savedTranslation.resultText).toBe('한국어 의결 결과');
      expect(savedTranslation.summary).toBe('한국어 요약');
    });

    it('의결 결과 번역의 title 필드를 동기화해야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting = { id: 'meeting-1', location: '서울', meetingDate: new Date() };
      const voteResult = { id: 'vote-1', shareholdersMeetingId: meeting.id };

      const koreanVoteTranslation = {
        id: 'vote-trans-ko',
        voteResultId: voteResult.id,
        languageId: koreanLanguage.id,
        title: '제1호 안건: 한국어 제목',
        isSynced: false,
      };

      const syncedVoteTranslation = {
        id: 'vote-trans-en',
        voteResultId: voteResult.id,
        languageId: 'en-id',
        title: '이전 안건 제목',
        isSynced: true,
      };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting as any,
      ]);
      meetingTranslationRepository.findOne.mockResolvedValue({
        id: 'trans-ko',
        title: '주주총회',
      } as any);
      meetingTranslationRepository.find.mockResolvedValue([]);
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([
        voteResult as any,
      ]);
      voteResultTranslationRepository.findOne.mockResolvedValue(
        koreanVoteTranslation as any,
      );
      voteResultTranslationRepository.find.mockResolvedValue([
        koreanVoteTranslation as any,
        syncedVoteTranslation as any,
      ]);
      voteResultTranslationRepository.save.mockResolvedValue(
        syncedVoteTranslation as any,
      );

      // When
      await handler.execute();

      // Then
      const savedTranslation = voteResultTranslationRepository.save.mock.calls[0][0];
      expect(savedTranslation.title).toBe('제1호 안건: 한국어 제목');
    });

    it('한국어 번역만 동기화 대상에서 제외해야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting = { id: 'meeting-1', location: '서울', meetingDate: new Date() };

      const koreanTranslation = {
        id: 'trans-ko',
        shareholdersMeetingId: meeting.id,
        languageId: koreanLanguage.id,
        title: '한국어 제목',
        isSynced: true, // 한국어도 isSynced=true이지만 동기화 대상이 아님
      };

      const englishTranslation = {
        id: 'trans-en',
        shareholdersMeetingId: meeting.id,
        languageId: 'en-id',
        title: '이전 제목',
        isSynced: true,
      };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting as any,
      ]);
      meetingTranslationRepository.findOne.mockResolvedValue(koreanTranslation as any);
      meetingTranslationRepository.find.mockResolvedValue([
        koreanTranslation as any,
        englishTranslation as any,
      ]);
      meetingTranslationRepository.save.mockResolvedValue(englishTranslation as any);
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([]);

      // When
      await handler.execute();

      // Then
      // 한국어를 제외한 1개만 동기화되어야 함
      expect(meetingTranslationRepository.save).toHaveBeenCalledTimes(1);
      const savedTranslation = meetingTranslationRepository.save.mock.calls[0][0];
      expect(savedTranslation.id).toBe('trans-en');
      expect(savedTranslation.languageId).not.toBe(koreanLanguage.id);
    });

    it('isSynced=false인 번역은 동기화하지 않아야 한다', async () => {
      // Given
      const koreanLanguage = { id: 'ko-id', code: 'ko', name: '한국어' };
      const meeting = { id: 'meeting-1', location: '서울', meetingDate: new Date() };

      const koreanTranslation = {
        id: 'trans-ko',
        shareholdersMeetingId: meeting.id,
        languageId: koreanLanguage.id,
        title: '한국어 제목',
        isSynced: false,
      };

      const englishTranslation = {
        id: 'trans-en',
        shareholdersMeetingId: meeting.id,
        languageId: 'en-id',
        title: '수동 설정된 영어 제목',
        isSynced: false, // 수동 설정 - 동기화하지 않음
      };

      languageService.코드로_언어를_조회한다.mockResolvedValue(koreanLanguage as any);
      shareholdersMeetingService.모든_주주총회를_조회한다.mockResolvedValue([
        meeting as any,
      ]);
      meetingTranslationRepository.findOne.mockResolvedValue(koreanTranslation as any);
      // find는 isSynced=true인 번역만 반환 (한국어만 있고, isSynced=false이므로 빈 배열)
      meetingTranslationRepository.find.mockResolvedValue([
        koreanTranslation as any,
      ]);
      shareholdersMeetingService.의결_결과를_조회한다.mockResolvedValue([]);

      // When
      await handler.execute();

      // Then
      expect(meetingTranslationRepository.save).not.toHaveBeenCalled(); // 동기화 안 함 (한국어는 제외되므로)
    });

    it('에러가 발생해도 로그만 남기고 계속 실행해야 한다', async () => {
      // Given
      languageService.코드로_언어를_조회한다.mockRejectedValue(
        new Error('언어 조회 실패'),
      );

      // When & Then - 에러가 던져지지 않아야 함
      await expect(handler.execute()).resolves.not.toThrow();
    });
  });
});
