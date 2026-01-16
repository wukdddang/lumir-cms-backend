import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LumirStoryService } from '@domain/sub/lumir-story/lumir-story.service';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LumirStoryService', () => {
  let service: LumirStoryService;
  let lumirStoryRepository: jest.Mocked<Repository<LumirStory>>;

  const mockLumirStoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LumirStoryService,
        {
          provide: getRepositoryToken(LumirStory),
          useValue: mockLumirStoryRepository,
        },
      ],
    }).compile();

    service = module.get<LumirStoryService>(LumirStoryService);
    lumirStoryRepository = module.get(getRepositoryToken(LumirStory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('루미르스토리를_생성한다', () => {
    it('루미르스토리를 생성해야 한다', async () => {
      // Given
      const createData = {
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
        isPublic: true,
        order: 0,
        createdBy: 'user-1',
      };

      const mockLumirStory = {
        id: 'lumir-story-1',
        ...createData,
        imageUrl: null,
        attachments: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLumirStoryRepository.create.mockReturnValue(mockLumirStory as any);
      mockLumirStoryRepository.save.mockResolvedValue(mockLumirStory as any);

      // When
      const result = await service.루미르스토리를_생성한다(createData);

      // Then
      expect(lumirStoryRepository.create).toHaveBeenCalledWith(createData);
      expect(lumirStoryRepository.save).toHaveBeenCalledWith(mockLumirStory);
      expect(result).toEqual(mockLumirStory);
    });

    it('첨부파일이 있는 루미르스토리를 생성해야 한다', async () => {
      // Given
      const createData = {
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
        isPublic: true,
        order: 0,
        attachments: [
          {
            fileName: 'story.pdf',
            fileUrl: 'https://s3.aws.com/story.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'user-1',
      };

      const mockLumirStory = {
        id: 'lumir-story-1',
        ...createData,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLumirStoryRepository.create.mockReturnValue(mockLumirStory as any);
      mockLumirStoryRepository.save.mockResolvedValue(mockLumirStory as any);

      // When
      const result = await service.루미르스토리를_생성한다(createData);

      // Then
      expect(result.attachments).toBeDefined();
      expect(result.attachments).not.toBeNull();
      expect(result.attachments!).toHaveLength(1);
      expect(result.attachments![0]).toMatchObject({
        fileName: 'story.pdf',
        fileUrl: 'https://s3.aws.com/story.pdf',
      });
    });

    it('이미지 URL이 있는 루미르스토리를 생성해야 한다', async () => {
      // Given
      const createData = {
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
        imageUrl: 'https://s3.aws.com/image.jpg',
        isPublic: true,
        order: 0,
        createdBy: 'user-1',
      };

      const mockLumirStory = {
        id: 'lumir-story-1',
        ...createData,
        attachments: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLumirStoryRepository.create.mockReturnValue(mockLumirStory as any);
      mockLumirStoryRepository.save.mockResolvedValue(mockLumirStory as any);

      // When
      const result = await service.루미르스토리를_생성한다(createData);

      // Then
      expect(result.imageUrl).toBe('https://s3.aws.com/image.jpg');
    });
  });

  describe('모든_루미르스토리를_조회한다', () => {
    it('모든 루미르스토리를 조회해야 한다', async () => {
      // Given
      const mockLumirStories = [
        {
          id: 'lumir-story-1',
          title: '스토리 1',
          isPublic: true,
          order: 0,
        },
        {
          id: 'lumir-story-2',
          title: '스토리 2',
          isPublic: true,
          order: 1,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLumirStories),
      };

      mockLumirStoryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_루미르스토리를_조회한다();

      // Then
      expect(lumirStoryRepository.createQueryBuilder).toHaveBeenCalledWith(
        'lumirStory',
      );
      expect(result).toEqual(mockLumirStories);
    });

    it('공개된 루미르스토리만 조회해야 한다', async () => {
      // Given
      const mockLumirStories = [
        {
          id: 'lumir-story-1',
          title: '스토리 1',
          isPublic: true,
          order: 0,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLumirStories),
      };

      mockLumirStoryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_루미르스토리를_조회한다({
        isPublic: true,
      });

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'lumirStory.isPublic = :isPublic',
        { isPublic: true },
      );
      expect(result).toEqual(mockLumirStories);
    });

    it('생성일 기준으로 정렬해야 한다', async () => {
      // Given
      const mockLumirStories = [
        { id: 'lumir-story-1', createdAt: new Date('2024-01-02') },
        { id: 'lumir-story-2', createdAt: new Date('2024-01-01') },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLumirStories),
      };

      mockLumirStoryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await service.모든_루미르스토리를_조회한다({
        orderBy: 'createdAt',
      });

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'lumirStory.createdAt',
        'DESC',
      );
      expect(result).toEqual(mockLumirStories);
    });
  });

  describe('ID로_루미르스토리를_조회한다', () => {
    it('ID로 루미르스토리를 조회해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const mockLumirStory = {
        id: lumirStoryId,
        title: '루미르 스토리',
        content: '내용',
        isPublic: true,
        order: 0,
      };

      mockLumirStoryRepository.findOne.mockResolvedValue(
        mockLumirStory as any,
      );

      // When
      const result = await service.ID로_루미르스토리를_조회한다(lumirStoryId);

      // Then
      expect(lumirStoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: lumirStoryId },
      });
      expect(result).toEqual(mockLumirStory);
    });

    it('루미르스토리가 존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const lumirStoryId = 'non-existent-id';
      mockLumirStoryRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.ID로_루미르스토리를_조회한다(lumirStoryId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('루미르스토리를_업데이트한다', () => {
    it('루미르스토리를 업데이트해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용',
        updatedBy: 'user-1',
      };

      const mockLumirStory = {
        id: lumirStoryId,
        title: '원래 제목',
        content: '원래 내용',
        isPublic: true,
        order: 0,
      };

      const mockUpdatedLumirStory = {
        ...mockLumirStory,
        ...updateData,
      };

      mockLumirStoryRepository.findOne.mockResolvedValue(
        mockLumirStory as any,
      );
      mockLumirStoryRepository.save.mockResolvedValue(
        mockUpdatedLumirStory as any,
      );

      // When
      const result = await service.루미르스토리를_업데이트한다(
        lumirStoryId,
        updateData,
      );

      // Then
      expect(lumirStoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: lumirStoryId },
      });
      expect(lumirStoryRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('수정된 제목');
      expect(result.content).toBe('수정된 내용');
    });
  });

  describe('루미르스토리를_삭제한다', () => {
    it('루미르스토리를 소프트 삭제해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const mockLumirStory = {
        id: lumirStoryId,
        title: '루미르 스토리',
        isPublic: true,
        order: 0,
      };

      mockLumirStoryRepository.findOne.mockResolvedValue(
        mockLumirStory as any,
      );
      mockLumirStoryRepository.softRemove.mockResolvedValue(
        mockLumirStory as any,
      );

      // When
      const result = await service.루미르스토리를_삭제한다(lumirStoryId);

      // Then
      expect(lumirStoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: lumirStoryId },
      });
      expect(lumirStoryRepository.softRemove).toHaveBeenCalledWith(
        mockLumirStory,
      );
      expect(result).toBe(true);
    });
  });

  describe('루미르스토리_공개_여부를_변경한다', () => {
    it('루미르스토리 공개 여부를 변경해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const isPublic = false;
      const updatedBy = 'user-1';

      const mockLumirStory = {
        id: lumirStoryId,
        isPublic: true,
        order: 0,
      };

      const mockUpdatedLumirStory = {
        ...mockLumirStory,
        isPublic,
        updatedBy,
      };

      mockLumirStoryRepository.findOne.mockResolvedValue(
        mockLumirStory as any,
      );
      mockLumirStoryRepository.save.mockResolvedValue(
        mockUpdatedLumirStory as any,
      );

      // When
      const result = await service.루미르스토리_공개_여부를_변경한다(
        lumirStoryId,
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
      const mockLumirStories = [{ order: 5 }];
      mockLumirStoryRepository.find.mockResolvedValue(mockLumirStories as any);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(lumirStoryRepository.find).toHaveBeenCalledWith({
        order: { order: 'DESC' },
        select: ['order'],
        take: 1,
      });
      expect(result).toBe(6);
    });

    it('루미르스토리가 없으면 0을 반환해야 한다', async () => {
      // Given
      mockLumirStoryRepository.find.mockResolvedValue([]);

      // When
      const result = await service.다음_순서를_계산한다();

      // Then
      expect(result).toBe(0);
    });
  });

  describe('공개된_루미르스토리를_조회한다', () => {
    it('공개된 루미르스토리만 조회해야 한다', async () => {
      // Given
      const mockLumirStories = [
        {
          id: 'lumir-story-1',
          title: '스토리 1',
          isPublic: true,
          order: 0,
        },
        {
          id: 'lumir-story-2',
          title: '스토리 2',
          isPublic: true,
          order: 1,
        },
      ];

      mockLumirStoryRepository.find.mockResolvedValue(mockLumirStories as any);

      // When
      const result = await service.공개된_루미르스토리를_조회한다();

      // Then
      expect(lumirStoryRepository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
        order: { order: 'ASC' },
      });
      expect(result).toEqual(mockLumirStories);
    });
  });

  describe('루미르스토리_오더를_일괄_업데이트한다', () => {
    it('여러 루미르스토리의 순서를 업데이트해야 한다', async () => {
      // Given
      const items = [
        { id: 'lumir-story-1', order: 0 },
        { id: 'lumir-story-2', order: 1 },
        { id: 'lumir-story-3', order: 2 },
      ];
      const updatedBy = 'user-1';

      const mockLumirStories = [
        { id: 'lumir-story-1', order: 5 },
        { id: 'lumir-story-2', order: 6 },
        { id: 'lumir-story-3', order: 7 },
      ];

      mockLumirStoryRepository.find.mockResolvedValue(mockLumirStories as any);
      mockLumirStoryRepository.save.mockResolvedValue({} as any);

      // When
      const result = await service.루미르스토리_오더를_일괄_업데이트한다(items, updatedBy);

      // Then
      expect(lumirStoryRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(lumirStoryRepository.save).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        success: true,
        updatedCount: 3,
      });
    });

    it('빈 배열이면 BadRequestException을 던져야 한다', async () => {
      // Given
      const items = [];

      // When & Then
      await expect(
        service.루미르스토리_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.루미르스토리_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow('수정할 루미르스토리가 없습니다.');
    });

    it('존재하지 않는 ID가 있으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const items = [
        { id: 'lumir-story-1', order: 0 },
        { id: 'non-existent', order: 1 },
      ];

      mockLumirStoryRepository.find.mockResolvedValue([
        { id: 'lumir-story-1', order: 0 },
      ] as any);

      // When & Then
      await expect(
        service.루미르스토리_오더를_일괄_업데이트한다(items),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
