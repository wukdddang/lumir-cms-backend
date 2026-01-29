import { Test, TestingModule } from '@nestjs/testing';
import { NewsContextService } from '@context/news-context/news-context.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { News } from '@domain/core/news/news.entity';
import {
  CreateNewsDto,
  UpdateNewsDto,
  UpdateNewsPublicDto,
  UpdateNewsFileDto,
} from '@context/news-context/interfaces/news-context.interface';

describe('NewsContextService', () => {
  let service: NewsContextService;
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
        NewsContextService,
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

    service = module.get<NewsContextService>(NewsContextService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('뉴스를_생성한다', () => {
    it('CreateNewsCommand를 실행해야 한다', async () => {
      // Given
      const createDto: CreateNewsDto = {
        title: '루미르 신제품 출시',
        description: '혁신적인 신제품이 출시되었습니다',
        url: 'https://news.example.com/lumir',
        categoryId: 'category-1',
        createdBy: 'user-1',
      };

      const mockResult = {
        id: 'news-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.뉴스를_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: createDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('첨부파일과 함께 뉴스를 생성해야 한다', async () => {
      // Given
      const createDto: CreateNewsDto = {
        title: '뉴스 제목',
        description: '뉴스 설명',
        categoryId: 'category-2',
        attachments: [
          {
            fileName: 'news.pdf',
            fileUrl: 'https://s3.aws.com/news.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
        createdBy: 'user-1',
      };

      const mockResult = {
        id: 'news-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.뉴스를_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('뉴스를_수정한다', () => {
    it('UpdateNewsCommand를 실행해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const updateDto: UpdateNewsDto = {
        title: '수정된 제목',
        description: '수정된 설명',
        categoryId: 'category-2',
        updatedBy: 'user-1',
      };

      const mockNews = {
        id: newsId,
        ...updateDto,
      } as News;

      mockCommandBus.execute.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스를_수정한다(newsId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newsId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('뉴스를_삭제한다', () => {
    it('DeleteNewsCommand를 실행해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      mockCommandBus.execute.mockResolvedValue(true);

      // When
      const result = await service.뉴스를_삭제한다(newsId);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newsId,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('뉴스_공개를_수정한다', () => {
    it('UpdateNewsPublicCommand를 실행해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const updateDto: UpdateNewsPublicDto = {
        isPublic: false,
        updatedBy: 'user-1',
      };

      const mockNews = {
        id: newsId,
        isPublic: false,
      } as News;

      mockCommandBus.execute.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스_공개를_수정한다(newsId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newsId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('뉴스_오더를_일괄_수정한다', () => {
    it('UpdateNewsBatchOrderCommand를 실행해야 한다', async () => {
      // Given
      const batchOrderDto = {
        news: [
          { id: 'news-1', order: 2 },
          { id: 'news-2', order: 1 },
          { id: 'news-3', order: 0 },
        ],
        updatedBy: 'user-1',
      };

      const mockResult = {
        success: true,
        updatedCount: 3,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.뉴스_오더를_일괄_수정한다(batchOrderDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: batchOrderDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('뉴스_파일을_수정한다', () => {
    it('UpdateNewsFileCommand를 실행해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const updateDto: UpdateNewsFileDto = {
        attachments: [
          {
            fileName: 'new-file.pdf',
            fileUrl: 'https://s3.aws.com/new-file.pdf',
            fileSize: 3048000,
            mimeType: 'application/pdf',
          },
        ],
        updatedBy: 'user-1',
      };

      const mockNews = {
        id: newsId,
        attachments: updateDto.attachments,
      } as News;

      mockCommandBus.execute.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스_파일을_수정한다(newsId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newsId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('뉴스_목록을_조회한다', () => {
    it('GetNewsListQuery를 실행해야 한다', async () => {
      // Given
      const isPublic = true;
      const orderBy = 'order';
      const page = 1;
      const limit = 10;

      const mockResult = {
        items: [
          {
            id: 'news-1',
            title: '뉴스 1',
            isPublic: true,
          } as News,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.뉴스_목록을_조회한다(
        isPublic,
        orderBy,
        page,
        limit,
      );

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic,
          orderBy,
          page,
          limit,
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('카테고리 ID로 필터링하여 조회해야 한다', async () => {
      // Given
      const categoryId = 'category-1';
      const mockResult = {
        items: [
          {
            id: 'news-1',
            categoryId: 'category-1',
            title: '뉴스 1',
            isPublic: true,
          } as News,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.뉴스_목록을_조회한다(
        undefined,
        'order',
        1,
        10,
        undefined,
        undefined,
        categoryId,
      );

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId,
        }),
      );
      expect(result.items[0].categoryId).toBe('category-1');
    });

    it('날짜 범위로 필터링하여 조회해야 한다', async () => {
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
      await service.뉴스_목록을_조회한다(
        undefined,
        'createdAt',
        1,
        10,
        startDate,
        endDate,
      );

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        }),
      );
    });
  });

  describe('뉴스_상세_조회한다', () => {
    it('GetNewsDetailQuery를 실행해야 한다', async () => {
      // Given
      const newsId = 'news-1';
      const mockNews = {
        id: newsId,
        title: '뉴스 1',
        description: '뉴스 설명',
        isPublic: true,
        categoryId: 'category-1',
        category: {
          name: '신제품',
        },
      } as News;

      mockQueryBus.execute.mockResolvedValue(mockNews);

      // When
      const result = await service.뉴스_상세_조회한다(newsId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newsId,
        }),
      );
      expect(result).toEqual(mockNews);
      expect(result.categoryId).toBe('category-1');
      expect(result.category?.name).toBe('신제품');
    });
  });
});
