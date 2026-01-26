import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LumirStoryContextService } from '@context/lumir-story-context/lumir-story-context.service';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';

describe('LumirStoryContextService', () => {
  let service: LumirStoryContextService;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LumirStoryContextService,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    service = module.get<LumirStoryContextService>(LumirStoryContextService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('루미르스토리를_생성한다', () => {
    it('CreateLumirStoryCommand를 실행해야 한다', async () => {
      // Given
      const createDto = {
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
        createdBy: 'user-1',
      };

      const mockResult = {
        id: 'new-lumir-story-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리를_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: createDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('첨부파일이 있는 루미르스토리를 생성해야 한다', async () => {
      // Given
      const createDto = {
        title: '루미르 스토리 제목',
        content: '루미르 스토리 내용',
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

      const mockResult = {
        id: 'new-lumir-story-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리를_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리를_수정한다', () => {
    it('UpdateLumirStoryCommand를 실행해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const updateDto = {
        title: '수정된 제목',
        content: '수정된 내용',
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: lumirStoryId,
        ...updateDto,
      } as any as LumirStory;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리를_수정한다(
        lumirStoryId,
        updateDto,
      );

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: lumirStoryId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리를_삭제한다', () => {
    it('DeleteLumirStoryCommand를 실행해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      mockCommandBus.execute.mockResolvedValue(true);

      // When
      const result = await service.루미르스토리를_삭제한다(lumirStoryId);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: lumirStoryId,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('루미르스토리_공개를_수정한다', () => {
    it('UpdateLumirStoryPublicCommand를 실행해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const updateDto = {
        isPublic: true,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: lumirStoryId,
        isPublic: true,
      } as any as LumirStory;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리_공개를_수정한다(
        lumirStoryId,
        updateDto,
      );

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: lumirStoryId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리_오더를_일괄_수정한다', () => {
    it('UpdateLumirStoryBatchOrderCommand를 실행해야 한다', async () => {
      // Given
      const batchOrderDto = {
        lumirStories: [
          { id: 'lumir-story-1', order: 0 },
          { id: 'lumir-story-2', order: 1 },
        ],
        updatedBy: 'user-1',
      };

      const mockResult = {
        success: true,
        updatedCount: 2,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리_오더를_일괄_수정한다(
        batchOrderDto,
      );

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: batchOrderDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리_파일을_수정한다', () => {
    it('UpdateLumirStoryFileCommand를 실행해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const fileDto = {
        attachments: [
          {
            fileName: 'new-story.pdf',
            fileUrl: 'https://s3.aws.com/new-story.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: lumirStoryId,
        attachments: fileDto.attachments,
      } as any as LumirStory;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리_파일을_수정한다(
        lumirStoryId,
        fileDto,
      );

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: lumirStoryId,
          data: fileDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리_목록을_조회한다', () => {
    it('GetLumirStoryListQuery를 실행해야 한다', async () => {
      // Given
      const isPublic = true;
      const orderBy = 'order' as const;
      const page = 1;
      const limit = 10;

      const mockResult = {
        items: [
          {
            id: 'lumir-story-1',
            title: '루미르 스토리',
            isPublic: true,
            order: 0,
          } as LumirStory,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리_목록을_조회한다(
        isPublic,
        orderBy,
        page,
        limit,
      );

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('날짜 필터를 포함하여 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.루미르스토리_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('루미르스토리_상세_조회한다', () => {
    it('GetLumirStoryDetailQuery를 실행해야 한다', async () => {
      // Given
      const lumirStoryId = 'lumir-story-1';
      const mockLumirStory = {
        id: lumirStoryId,
        title: '루미르 스토리',
        content: '내용',
        isPublic: true,
        order: 0,
        attachments: null,
        categoryId: 'category-1',
        category: {
          name: '혁신',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any as LumirStory;

      mockQueryBus.execute.mockResolvedValue(mockLumirStory);

      // When
      const result = await service.루미르스토리_상세_조회한다(lumirStoryId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: lumirStoryId,
        }),
      );
      expect(result).toEqual(mockLumirStory);
      expect(result.categoryId).toBe('category-1');
      expect(result.category?.name).toBe('혁신');
    });
  });
});
