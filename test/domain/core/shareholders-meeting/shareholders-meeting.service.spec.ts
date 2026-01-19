import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareholdersMeetingService } from '@domain/core/shareholders-meeting/shareholders-meeting.service';
import { ShareholdersMeeting } from '@domain/core/shareholders-meeting/shareholders-meeting.entity';
import { ShareholdersMeetingTranslation } from '@domain/core/shareholders-meeting/shareholders-meeting-translation.entity';
import { VoteResult } from '@domain/core/shareholders-meeting/vote-result.entity';
import { VoteResultTranslation } from '@domain/core/shareholders-meeting/vote-result-translation.entity';
import { VoteResultType } from '@domain/core/shareholders-meeting/vote-result-type.types';
import { NotFoundException } from '@nestjs/common';

describe('ShareholdersMeetingService', () => {
  let service: ShareholdersMeetingService;
  let shareholdersMeetingRepository: jest.Mocked<Repository<ShareholdersMeeting>>;
  let translationRepository: jest.Mocked<Repository<ShareholdersMeetingTranslation>>;
  let voteResultRepository: jest.Mocked<Repository<VoteResult>>;
  let voteResultTranslationRepository: jest.Mocked<Repository<VoteResultTranslation>>;

  const mockShareholdersMeetingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTranslationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockVoteResultRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockVoteResultTranslationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareholdersMeetingService,
        {
          provide: getRepositoryToken(ShareholdersMeeting),
          useValue: mockShareholdersMeetingRepository,
        },
        {
          provide: getRepositoryToken(ShareholdersMeetingTranslation),
          useValue: mockTranslationRepository,
        },
        {
          provide: getRepositoryToken(VoteResult),
          useValue: mockVoteResultRepository,
        },
        {
          provide: getRepositoryToken(VoteResultTranslation),
          useValue: mockVoteResultTranslationRepository,
        },
      ],
    }).compile();

    service = module.get<ShareholdersMeetingService>(ShareholdersMeetingService);
    shareholdersMeetingRepository = module.get(getRepositoryToken(ShareholdersMeeting));
    translationRepository = module.get(getRepositoryToken(ShareholdersMeetingTranslation));
    voteResultRepository = module.get(getRepositoryToken(VoteResult));
    voteResultTranslationRepository = module.get(getRepositoryToken(VoteResultTranslation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('주주총회를_생성한다', () => {
    it('주주총회를 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        location: '서울 강남구 루미르 본사',
        meetingDate: new Date('2024-03-15'),
        order: 0,
        createdBy: 'user-1',
      };

      const mockMeeting = {
        id: 'meeting-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShareholdersMeetingRepository.create.mockReturnValue(mockMeeting as any);
      mockShareholdersMeetingRepository.save.mockResolvedValue(mockMeeting as any);

      // When
      const result = await service.주주총회를_생성한다(createData);

      // Then
      expect(shareholdersMeetingRepository.create).toHaveBeenCalledWith(createData);
      expect(shareholdersMeetingRepository.save).toHaveBeenCalledWith(mockMeeting);
      expect(result).toEqual(mockMeeting);
    });

    it('첨부파일이 있는 주주총회를 생성해야 한다', async () => {
      // Given
      const createData = {
        isPublic: true,
        location: '서울 강남구',
        meetingDate: new Date('2024-03-15'),
        order: 0,
        attachments: [
          {
            fileName: 'minutes.pdf',
            fileUrl: 'https://s3.aws.com/minutes.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'user-1',
      };

      const mockMeeting = {
        id: 'meeting-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShareholdersMeetingRepository.create.mockReturnValue(mockMeeting as any);
      mockShareholdersMeetingRepository.save.mockResolvedValue(mockMeeting as any);

      // When
      const result = await service.주주총회를_생성한다(createData);

      // Then
      expect(result.attachments).toBeDefined();
      expect(result.attachments).not.toBeNull();
      expect(result.attachments!).toHaveLength(1);
      expect(result.attachments![0]).toMatchObject({
        fileName: 'minutes.pdf',
        fileUrl: 'https://s3.aws.com/minutes.pdf',
      });
    });
  });

  describe('모든_주주총회를_조회한다', () => {
    it('모든 주주총회를 조회해야 한다', async () => {
      // Given
      const mockMeetings = [
        {
          id: 'meeting-1',
          isPublic: true,
          location: '서울',
          meetingDate: new Date('2024-03-15'),
          order: 0,
        },
        {
          id: 'meeting-2',
          isPublic: true,
          location: '부산',
          meetingDate: new Date('2024-06-20'),
          order: 1,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockMeetings),
      };

      mockShareholdersMeetingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_주주총회를_조회한다();

      // Then
      expect(shareholdersMeetingRepository.createQueryBuilder).toHaveBeenCalledWith('meeting');
      expect(result).toEqual(mockMeetings);
    });

    it('공개된 주주총회만 조회해야 한다', async () => {
      // Given
      const mockMeetings = [
        {
          id: 'meeting-1',
          isPublic: true,
          location: '서울',
          meetingDate: new Date('2024-03-15'),
          order: 0,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockMeetings),
      };

      mockShareholdersMeetingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_주주총회를_조회한다({ isPublic: true });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('meeting.isPublic = :isPublic', {
        isPublic: true,
      });
      expect(result).toEqual(mockMeetings);
    });

    it('주주총회 일시 기준으로 정렬해야 한다', async () => {
      // Given
      const mockMeetings = [
        { id: 'meeting-1', meetingDate: new Date('2024-06-15') },
        { id: 'meeting-2', meetingDate: new Date('2024-03-10') },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockMeetings),
      };

      mockShareholdersMeetingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_주주총회를_조회한다({
        orderBy: 'meetingDate',
      });

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('meeting.meetingDate', 'DESC');
      expect(result).toEqual(mockMeetings);
    });

    it('날짜 범위로 필터링해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockMeetings = [
        { id: 'meeting-1', meetingDate: new Date('2024-03-15') },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockMeetings),
      };

      mockShareholdersMeetingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_주주총회를_조회한다({
        startDate,
        endDate,
      });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('meeting.createdAt >= :startDate', {
        startDate,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('meeting.createdAt <= :endDate', {
        endDate,
      });
      expect(result).toEqual(mockMeetings);
    });
  });

  describe('ID로_주주총회를_조회한다', () => {
    it('ID로 주주총회를 조회해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const mockMeeting = {
        id: meetingId,
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
        order: 0,
        translations: [],
        voteResults: [],
      };

      mockShareholdersMeetingRepository.findOne.mockResolvedValue(mockMeeting as any);

      // When
      const result = await service.ID로_주주총회를_조회한다(meetingId);

      // Then
      expect(shareholdersMeetingRepository.findOne).toHaveBeenCalledWith({
        where: { id: meetingId },
        relations: [
          'translations',
          'translations.language',
          'voteResults',
          'voteResults.translations',
          'voteResults.translations.language',
        ],
      });
      expect(result).toEqual(mockMeeting);
    });

    it('주주총회가 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const meetingId = 'non-existent-id';
      mockShareholdersMeetingRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.ID로_주주총회를_조회한다(meetingId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('주주총회를_업데이트한다', () => {
    it('주주총회를 업데이트해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const updateData = {
        isPublic: false,
        location: '부산 해운대',
        updatedBy: 'user-1',
      };

      const mockMeeting = {
        id: meetingId,
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
        order: 0,
        translations: [],
        voteResults: [],
      };

      const mockUpdatedMeeting = {
        ...mockMeeting,
        ...updateData,
      };

      mockShareholdersMeetingRepository.findOne.mockResolvedValue(mockMeeting as any);
      mockShareholdersMeetingRepository.save.mockResolvedValue(mockUpdatedMeeting as any);

      // When
      const result = await service.주주총회를_업데이트한다(meetingId, updateData);

      // Then
      expect(shareholdersMeetingRepository.findOne).toHaveBeenCalledWith({
        where: { id: meetingId },
        relations: [
          'translations',
          'translations.language',
          'voteResults',
          'voteResults.translations',
          'voteResults.translations.language',
        ],
      });
      expect(shareholdersMeetingRepository.save).toHaveBeenCalled();
      expect(result.isPublic).toBe(false);
      expect(result.location).toBe('부산 해운대');
    });
  });

  describe('주주총회를_삭제한다', () => {
    it('주주총회를 소프트 삭제해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const mockMeeting = {
        id: meetingId,
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
        order: 0,
        translations: [],
        voteResults: [],
      };

      mockShareholdersMeetingRepository.findOne.mockResolvedValue(mockMeeting as any);
      mockShareholdersMeetingRepository.softRemove.mockResolvedValue(mockMeeting as any);

      // When
      const result = await service.주주총회를_삭제한다(meetingId);

      // Then
      expect(shareholdersMeetingRepository.findOne).toHaveBeenCalledWith({
        where: { id: meetingId },
        relations: [
          'translations',
          'translations.language',
          'voteResults',
          'voteResults.translations',
          'voteResults.translations.language',
        ],
      });
      expect(shareholdersMeetingRepository.softRemove).toHaveBeenCalledWith(mockMeeting);
      expect(result).toBe(true);
    });
  });

  describe('주주총회_공개_여부를_변경한다', () => {
    it('주주총회 공개 여부를 변경해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockMeeting = {
        id: meetingId,
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
        order: 0,
        translations: [],
        voteResults: [],
      };

      const mockUpdatedMeeting = {
        ...mockMeeting,
        isPublic,
        updatedBy,
      };

      mockShareholdersMeetingRepository.findOne.mockResolvedValue(mockMeeting as any);
      mockShareholdersMeetingRepository.save.mockResolvedValue(mockUpdatedMeeting as any);

      // When
      const result = await service.주주총회_공개_여부를_변경한다(
        meetingId,
        isPublic,
        updatedBy,
      );

      // Then
      expect(result.isPublic).toBe(false);
      expect(result.updatedBy).toBe(updatedBy);
    });
  });

  describe('다음_순서를_계산한다', () => {
    it('다음 순서 번호를 계산해야 한다', async () => {
      // Given
      const mockMeetings = [{ order: 5 }];
      mockShareholdersMeetingRepository.find.mockResolvedValue(mockMeetings as any);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(shareholdersMeetingRepository.find).toHaveBeenCalledWith({
        order: { order: 'DESC' },
        select: ['order'],
        take: 1,
      });
      expect(result).toBe(6);
    });

    it('주주총회가 없으면 0을 반환해야 한다', async () => {
      // Given
      mockShareholdersMeetingRepository.find.mockResolvedValue([]);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(0);
    });
  });

  describe('주주총회_번역을_조회한다', () => {
    it('주주총회 번역을 조회해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const mockTranslations = [
        {
          id: 'translation-1',
          shareholdersMeetingId: meetingId,
          languageId: 'language-1',
          title: '제38기 정기 주주총회',
          description: '정기 주주총회 안내',
        },
      ];

      mockTranslationRepository.find.mockResolvedValue(mockTranslations as any);

      // When
      const result = await service.주주총회_번역을_조회한다(meetingId);

      // Then
      expect(translationRepository.find).toHaveBeenCalledWith({
        where: { shareholdersMeetingId: meetingId },
        relations: ['language'],
      });
      expect(result).toEqual(mockTranslations);
    });
  });

  describe('공개된_주주총회를_조회한다', () => {
    it('공개된 주주총회만 조회해야 한다', async () => {
      // Given
      const mockMeetings = [
        {
          id: 'meeting-1',
          isPublic: true,
          location: '서울',
          meetingDate: new Date('2024-03-15'),
          order: 0,
          translations: [],
          voteResults: [],
        },
        {
          id: 'meeting-2',
          isPublic: true,
          location: '부산',
          meetingDate: new Date('2024-06-20'),
          order: 1,
          translations: [],
          voteResults: [],
        },
      ];

      mockShareholdersMeetingRepository.find.mockResolvedValue(mockMeetings as any);

      // When
      const result = await service.공개된_주주총회를_조회한다();

      // Then
      expect(shareholdersMeetingRepository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
        order: { meetingDate: 'DESC' },
        relations: [
          'translations',
          'translations.language',
          'voteResults',
          'voteResults.translations',
        ],
      });
      expect(result).toEqual(mockMeetings);
    });
  });

  describe('의결_결과를_조회한다', () => {
    it('주주총회의 의결 결과를 조회해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const mockVoteResults = [
        {
          id: 'vote-1',
          shareholdersMeetingId: meetingId,
          agendaNumber: 1,
          totalVote: 1000,
          yesVote: 850,
          noVote: 150,
          approvalRating: 85.0,
          result: VoteResultType.ACCEPTED,
          translations: [],
        },
      ];

      mockVoteResultRepository.find.mockResolvedValue(mockVoteResults as any);

      // When
      const result = await service.의결_결과를_조회한다(meetingId);

      // Then
      expect(voteResultRepository.find).toHaveBeenCalledWith({
        where: { shareholdersMeetingId: meetingId },
        relations: ['translations', 'translations.language'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockVoteResults);
    });
  });

  describe('주주총회_번역을_생성한다', () => {
    it('주주총회 번역을 생성해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '제38기 정기 주주총회',
          description: '2024년 정기 주주총회 안내',
          isSynced: false,
        },
      ];
      const createdBy = 'user-1';

      const mockTranslationEntities = translations.map((t) => ({
        id: 'translation-1',
        shareholdersMeetingId: meetingId,
        ...t,
        createdBy,
      }));

      mockTranslationRepository.create.mockImplementation((data) => data as any);
      mockTranslationRepository.save.mockResolvedValue(mockTranslationEntities as any);

      // When
      const result = await service.주주총회_번역을_생성한다(
        meetingId,
        translations,
        createdBy,
      );

      // Then
      expect(translationRepository.create).toHaveBeenCalledTimes(1);
      expect(translationRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTranslationEntities);
    });
  });

  describe('주주총회_번역을_업데이트한다', () => {
    it('주주총회 번역을 업데이트해야 한다', async () => {
      // Given
      const translationId = 'translation-1';
      const updateData = {
        title: '수정된 제목',
        description: '수정된 설명',
        isSynced: false,
        updatedBy: 'user-1',
      };

      const mockTranslation = {
        id: translationId,
        shareholdersMeetingId: 'meeting-1',
        languageId: 'language-1',
        title: '원래 제목',
        description: '원래 설명',
        isSynced: true,
      };

      const mockUpdatedTranslation = {
        ...mockTranslation,
        ...updateData,
      };

      mockTranslationRepository.findOne.mockResolvedValue(mockTranslation as any);
      mockTranslationRepository.save.mockResolvedValue(mockUpdatedTranslation as any);

      // When
      const result = await service.주주총회_번역을_업데이트한다(translationId, updateData);

      // Then
      expect(translationRepository.findOne).toHaveBeenCalledWith({
        where: { id: translationId },
      });
      expect(translationRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('수정된 제목');
      expect(result.isSynced).toBe(false);
    });

    it('번역이 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const translationId = 'non-existent-id';
      mockTranslationRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.주주총회_번역을_업데이트한다(translationId, { title: '제목' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('주주총회_오더를_일괄_업데이트한다', () => {
    it('주주총회 오더를 일괄 업데이트해야 한다', async () => {
      // Given
      const items = [
        { id: 'meeting-1', order: 2 },
        { id: 'meeting-2', order: 0 },
        { id: 'meeting-3', order: 1 },
      ];
      const updatedBy = 'user-1';

      const mockMeetings = items.map((item) => ({
        id: item.id,
        isPublic: true,
        location: '서울',
        meetingDate: new Date('2024-03-15'),
        order: 0,
        translations: [],
        voteResults: [],
      }));

      mockShareholdersMeetingRepository.findOne
        .mockResolvedValueOnce(mockMeetings[0] as any)
        .mockResolvedValueOnce(mockMeetings[1] as any)
        .mockResolvedValueOnce(mockMeetings[2] as any);
      mockShareholdersMeetingRepository.save.mockResolvedValue({} as any);

      // When
      const result = await service.주주총회_오더를_일괄_업데이트한다(items, updatedBy);

      // Then
      expect(shareholdersMeetingRepository.findOne).toHaveBeenCalledTimes(3);
      expect(shareholdersMeetingRepository.save).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        success: true,
        updatedCount: 3,
      });
    });
  });

  describe('의결_결과를_생성한다', () => {
    it('의결 결과를 생성해야 한다', async () => {
      // Given
      const meetingId = 'meeting-1';
      const voteResultData = {
        agendaNumber: 1,
        totalVote: 1000,
        yesVote: 850,
        noVote: 150,
        approvalRating: 85.0,
        result: VoteResultType.ACCEPTED,
      };

      const mockVoteResult = {
        id: 'vote-1',
        shareholdersMeetingId: meetingId,
        ...voteResultData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVoteResultRepository.create.mockReturnValue(mockVoteResult as any);
      mockVoteResultRepository.save.mockResolvedValue(mockVoteResult as any);

      // When
      const result = await service.의결_결과를_생성한다(meetingId, voteResultData);

      // Then
      expect(voteResultRepository.create).toHaveBeenCalledWith({
        ...voteResultData,
        shareholdersMeetingId: meetingId,
      });
      expect(voteResultRepository.save).toHaveBeenCalledWith(mockVoteResult);
      expect(result).toEqual(mockVoteResult);
    });
  });

  describe('의결_결과를_업데이트한다', () => {
    it('의결 결과를 업데이트해야 한다', async () => {
      // Given
      const voteResultId = 'vote-1';
      const updateData = {
        totalVote: 1200,
        yesVote: 1000,
        noVote: 200,
        approvalRating: 83.3,
        result: VoteResultType.ACCEPTED,
      };

      const mockVoteResult = {
        id: voteResultId,
        shareholdersMeetingId: 'meeting-1',
        agendaNumber: 1,
        totalVote: 1000,
        yesVote: 850,
        noVote: 150,
        approvalRating: 85.0,
        result: VoteResultType.ACCEPTED,
      };

      const mockUpdatedVoteResult = {
        ...mockVoteResult,
        ...updateData,
      };

      mockVoteResultRepository.findOne.mockResolvedValue(mockVoteResult as any);
      mockVoteResultRepository.save.mockResolvedValue(mockUpdatedVoteResult as any);

      // When
      const result = await service.의결_결과를_업데이트한다(voteResultId, updateData);

      // Then
      expect(voteResultRepository.findOne).toHaveBeenCalledWith({
        where: { id: voteResultId },
      });
      expect(voteResultRepository.save).toHaveBeenCalled();
      expect(result.totalVote).toBe(1200);
      expect(result.approvalRating).toBe(83.3);
    });

    it('의결 결과가 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const voteResultId = 'non-existent-id';
      mockVoteResultRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.의결_결과를_업데이트한다(voteResultId, { totalVote: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('의결_결과를_삭제한다', () => {
    it('의결 결과를 소프트 삭제해야 한다', async () => {
      // Given
      const voteResultId = 'vote-1';
      const mockVoteResult = {
        id: voteResultId,
        shareholdersMeetingId: 'meeting-1',
        agendaNumber: 1,
        totalVote: 1000,
        yesVote: 850,
        noVote: 150,
        approvalRating: 85.0,
        result: VoteResultType.ACCEPTED,
      };

      mockVoteResultRepository.findOne.mockResolvedValue(mockVoteResult as any);
      mockVoteResultRepository.softRemove.mockResolvedValue(mockVoteResult as any);

      // When
      const result = await service.의결_결과를_삭제한다(voteResultId);

      // Then
      expect(voteResultRepository.findOne).toHaveBeenCalledWith({
        where: { id: voteResultId },
      });
      expect(voteResultRepository.softRemove).toHaveBeenCalledWith(mockVoteResult);
      expect(result).toBe(true);
    });

    it('의결 결과가 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const voteResultId = 'non-existent-id';
      mockVoteResultRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.의결_결과를_삭제한다(voteResultId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('의결_결과_번역을_생성한다', () => {
    it('의결 결과 번역을 생성해야 한다', async () => {
      // Given
      const voteResultId = 'vote-1';
      const translations = [
        {
          languageId: 'language-1',
          title: '제1호 안건: 재무제표 승인',
          isSynced: false,
        },
      ];
      const createdBy = 'user-1';

      const mockTranslationEntities = translations.map((t) => ({
        id: 'translation-1',
        voteResultId,
        ...t,
        createdBy,
      }));

      mockVoteResultTranslationRepository.create.mockImplementation((data) => data as any);
      mockVoteResultTranslationRepository.save.mockResolvedValue(mockTranslationEntities as any);

      // When
      const result = await service.의결_결과_번역을_생성한다(
        voteResultId,
        translations,
        createdBy,
      );

      // Then
      expect(voteResultTranslationRepository.create).toHaveBeenCalledTimes(1);
      expect(voteResultTranslationRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTranslationEntities);
    });
  });

  describe('의결_결과_번역을_업데이트한다', () => {
    it('의결 결과 번역을 업데이트해야 한다', async () => {
      // Given
      const translationId = 'translation-1';
      const updateData = {
        title: '수정된 안건 제목',
        isSynced: false,
        updatedBy: 'user-1',
      };

      const mockTranslation = {
        id: translationId,
        voteResultId: 'vote-1',
        languageId: 'language-1',
        title: '원래 안건 제목',
        isSynced: true,
      };

      const mockUpdatedTranslation = {
        ...mockTranslation,
        ...updateData,
      };

      mockVoteResultTranslationRepository.findOne.mockResolvedValue(mockTranslation as any);
      mockVoteResultTranslationRepository.save.mockResolvedValue(mockUpdatedTranslation as any);

      // When
      const result = await service.의결_결과_번역을_업데이트한다(translationId, updateData);

      // Then
      expect(voteResultTranslationRepository.findOne).toHaveBeenCalledWith({
        where: { id: translationId },
      });
      expect(voteResultTranslationRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('수정된 안건 제목');
      expect(result.isSynced).toBe(false);
    });

    it('번역이 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const translationId = 'non-existent-id';
      mockVoteResultTranslationRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.의결_결과_번역을_업데이트한다(translationId, { title: '제목' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('의결_결과_번역을_조회한다', () => {
    it('의결 결과 번역을 조회해야 한다', async () => {
      // Given
      const voteResultId = 'vote-1';
      const mockTranslations = [
        {
          id: 'translation-1',
          voteResultId,
          languageId: 'language-1',
          title: '제1호 안건: 재무제표 승인',
        },
      ];

      mockVoteResultTranslationRepository.find.mockResolvedValue(mockTranslations as any);

      // When
      const result = await service.의결_결과_번역을_조회한다(voteResultId);

      // Then
      expect(voteResultTranslationRepository.find).toHaveBeenCalledWith({
        where: { voteResultId },
        relations: ['language'],
      });
      expect(result).toEqual(mockTranslations);
    });
  });
});
