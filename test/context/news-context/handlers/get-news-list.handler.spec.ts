import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GetNewsListHandler,
  GetNewsListQuery,
} from '@context/news-context/handlers/queries/get-news-list.handler';
import { News } from '@domain/core/news/news.entity';

describe('GetNewsListHandler', () => {
  let handler: GetNewsListHandler;
  let newsRepository: jest.Mocked<Repository<News>>;

  const mockQueryBuilder: any = {
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
    getCount: jest.fn(),
  };

  const mockNewsRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetNewsListHandler,
        {
          provide: getRepositoryToken(News),
          useValue: mockNewsRepository,
        },
      ],
    }).compile();

    handler = module.get<GetNewsListHandler>(GetNewsListHandler);
    newsRepository = module.get(getRepositoryToken(News));

    // Reset mock after each test setup
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('기본 파라미터로 뉴스 목록을 조회해야 한다', async () => {
      // Given
      const query = new GetNewsListQuery(undefined, 'order', 1, 10);

      const mockNews = [
        {
          id: 'news-1',
          categoryId: 'cat-1',
          title: '테스트 뉴스',
          isPublic: true,
          order: 0,
          attachments: [],
        } as News,
      ];

      const mockRaw = [
        {
          category_name: '신제품',
        },
      ];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // When
      const result = await handler.execute(query);

      // Then
      expect(newsRepository.createQueryBuilder).toHaveBeenCalledWith('news');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'categories',
        'category',
        'news.categoryId = category.id',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith([
        'category.name',
      ]);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'news.order',
        'ASC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        items: mockNews,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(result.items[0].category?.name).toBe('신제품');
    });

    it('카테고리 ID로 필터링하여 조회해야 한다', async () => {
      // Given
      const categoryId = 'category-uuid-1';
      const query = new GetNewsListQuery(
        undefined,
        'order',
        1,
        10,
        undefined,
        undefined,
        categoryId,
      );

      const mockNews = [
        {
          id: 'news-1',
          categoryId: 'category-uuid-1',
          title: '테스트 뉴스',
          isPublic: true,
          order: 0,
          attachments: [],
        } as News,
      ];

      const mockRaw = [
        {
          category_name: '신제품',
        },
      ];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'news.categoryId = :categoryId',
        { categoryId: 'category-uuid-1' },
      );
      expect(result.items).toEqual(mockNews);
      expect(result.items[0].categoryId).toBe('category-uuid-1');
      expect(result.total).toBe(1);
    });

    it('공개 여부로 필터링하여 조회해야 한다', async () => {
      // Given
      const query = new GetNewsListQuery(true, 'order', 1, 10);

      const mockNews = [
        {
          id: 'news-1',
          title: '테스트 뉴스',
          isPublic: true,
          attachments: [],
        } as News,
      ];

      const mockRaw = [{}];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'news.isPublic = :isPublic',
        { isPublic: true },
      );
      expect(result.items).toEqual(mockNews);
    });

    it('카테고리 ID와 공개 여부로 필터링하여 조회해야 한다', async () => {
      // Given
      const categoryId = 'category-uuid-1';
      const query = new GetNewsListQuery(
        true,
        'order',
        1,
        10,
        undefined,
        undefined,
        categoryId,
      );

      const mockNews = [
        {
          id: 'news-1',
          categoryId: 'category-uuid-1',
          title: '테스트 뉴스',
          isPublic: true,
          order: 0,
          attachments: [],
        } as News,
      ];

      const mockRaw = [
        {
          category_name: '신제품',
        },
      ];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'news.isPublic = :isPublic',
        { isPublic: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'news.categoryId = :categoryId',
        { categoryId: 'category-uuid-1' },
      );
      expect(result.items).toEqual(mockNews);
      expect(result.items[0].categoryId).toBe('category-uuid-1');
    });

    it('날짜 범위로 필터링하여 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const query = new GetNewsListQuery(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      const mockNews = [
        {
          id: 'news-1',
          title: '테스트 뉴스',
          createdAt: new Date('2024-06-15'),
          attachments: [],
        } as News,
      ];

      const mockRaw = [{}];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'news.createdAt >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'news.createdAt <= :endDate',
        { endDate },
      );
      expect(result.items).toEqual(mockNews);
    });

    it('생성일시 기준으로 정렬하여 조회해야 한다', async () => {
      // Given
      const query = new GetNewsListQuery(undefined, 'createdAt', 1, 10);

      const mockNews = [
        {
          id: 'news-1',
          title: '테스트 뉴스',
          createdAt: new Date(),
          attachments: [],
        } as News,
      ];

      const mockRaw = [{}];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'news.createdAt',
        'DESC',
      );
      expect(result.items).toEqual(mockNews);
    });

    it('페이지네이션을 올바르게 적용해야 한다', async () => {
      // Given
      const query = new GetNewsListQuery(undefined, 'order', 2, 5);

      const mockNews = [] as News[];
      const mockRaw = [];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(0);

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page-1) * limit = (2-1) * 5 = 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('deletedAt이 있는 첨부파일을 필터링해야 한다', async () => {
      // Given
      const query = new GetNewsListQuery(undefined, 'order', 1, 10);

      const mockNews = [
        {
          id: 'news-1',
          title: '테스트 뉴스',
          attachments: [
            {
              fileName: 'active-file.pdf',
              fileUrl: 'https://s3.aws.com/active-file.pdf',
              deletedAt: null,
            },
            {
              fileName: 'deleted-file.pdf',
              fileUrl: 'https://s3.aws.com/deleted-file.pdf',
              deletedAt: new Date(),
            },
          ],
        } as News,
      ];

      const mockRaw = [{}];

      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: mockNews,
        raw: mockRaw,
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // When
      const result = await handler.execute(query);

      // Then
      expect(result.items[0].attachments).toHaveLength(1);
      expect(result.items[0].attachments[0].fileName).toBe('active-file.pdf');
    });
  });
});
