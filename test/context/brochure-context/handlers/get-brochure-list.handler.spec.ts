import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  GetBrochureListHandler,
  GetBrochureListQuery,
} from '@context/brochure-context/handlers/queries/get-brochure-list.handler';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { BrochureTranslation } from '@domain/core/brochure/brochure-translation.entity';

describe('GetBrochureListHandler', () => {
  let handler: GetBrochureListHandler;
  let brochureRepository: jest.Mocked<Repository<Brochure>>;

  const mockBrochureRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBrochureListHandler,
        {
          provide: getRepositoryToken(Brochure),
          useValue: mockBrochureRepository,
        },
      ],
    }).compile();

    handler = module.get<GetBrochureListHandler>(GetBrochureListHandler);
    brochureRepository = module.get(getRepositoryToken(Brochure));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockQueryBuilder = (items: Partial<Brochure>[], total: number) => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      subQuery: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('subquery'),
      getManyAndCount: jest.fn().mockResolvedValue([items, total]),
    };
    return mockQueryBuilder;
  };

  describe('execute', () => {
    it('브로슈어 목록을 조회해야 한다', async () => {
      // Given
      const query = new GetBrochureListQuery(undefined, 'order', 1, 10);

      const mockBrochures = [
        {
          id: 'brochure-1',
          isPublic: true,
          order: 0,
          translations: [
            {
              id: 'translation-1',
              title: '회사 소개',
              language: { code: 'ko', name: '한국어' },
            },
          ],
        },
        {
          id: 'brochure-2',
          isPublic: true,
          order: 1,
          translations: [
            {
              id: 'translation-2',
              title: '제품 소개',
              language: { code: 'ko', name: '한국어' },
            },
          ],
        },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockBrochures as any, 2);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(brochureRepository.createQueryBuilder).toHaveBeenCalledWith(
        'brochure',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'brochure.translations',
        'translations',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'brochure.order',
        'ASC',
      );
      expect(result).toEqual({
        items: mockBrochures,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('공개된 브로슈어만 조회해야 한다', async () => {
      // Given
      const query = new GetBrochureListQuery(true, 'order', 1, 10);

      const mockBrochures = [
        {
          id: 'brochure-1',
          isPublic: true,
          order: 0,
          translations: [
            {
              language: { code: 'ko' },
            },
          ],
        },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockBrochures as any, 1);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'brochure.isPublic = :isPublic',
        { isPublic: true },
      );
      expect(result.total).toBe(1);
    });

    it('비공개 브로슈어만 조회해야 한다', async () => {
      // Given
      const query = new GetBrochureListQuery(false, 'order', 1, 10);

      const mockBrochures = [
        {
          id: 'brochure-1',
          isPublic: false,
          order: 0,
          translations: [
            {
              language: { code: 'ko' },
            },
          ],
        },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockBrochures as any, 1);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'brochure.isPublic = :isPublic',
        { isPublic: false },
      );
      expect(result.items[0].isPublic).toBe(false);
    });

    it('생성일 기준으로 정렬해야 한다', async () => {
      // Given
      const query = new GetBrochureListQuery(undefined, 'createdAt', 1, 10);

      const mockBrochures = [
        {
          id: 'brochure-1',
          createdAt: new Date('2024-01-02'),
          translations: [
            {
              language: { code: 'ko' },
            },
          ],
        },
        {
          id: 'brochure-2',
          createdAt: new Date('2024-01-01'),
          translations: [
            {
              language: { code: 'ko' },
            },
          ],
        },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockBrochures as any, 2);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'brochure.createdAt',
        'DESC',
      );
    });

    it('페이지네이션을 적용해야 한다', async () => {
      // Given
      const query = new GetBrochureListQuery(undefined, 'order', 2, 5);

      const mockBrochures = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `brochure-${i + 6}`,
          order: i + 5,
          translations: [
            {
              language: { code: 'ko' },
            },
          ],
        }));

      const mockQueryBuilder = createMockQueryBuilder(mockBrochures as any, 15);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (2-1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        items: mockBrochures,
        total: 15,
        page: 2,
        limit: 5,
      });
    });

    it('날짜 필터를 적용해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const query = new GetBrochureListQuery(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      const mockBrochures = [
        {
          id: 'brochure-1',
          createdAt: new Date('2024-06-15'),
          translations: [
            {
              language: { code: 'ko' },
            },
          ],
        },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockBrochures as any, 1);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'brochure.createdAt >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'brochure.createdAt <= :endDate',
        { endDate },
      );
      expect(result.total).toBe(1);
    });

    it('한국어 번역만 필터링해야 한다', async () => {
      // Given
      const query = new GetBrochureListQuery(undefined, 'order', 1, 10);

      const mockBrochures = [
        {
          id: 'brochure-1',
          order: 0,
          translations: [
            {
              id: 'translation-1',
              title: '회사 소개',
              language: { code: 'ko', name: '한국어' },
            },
            {
              id: 'translation-2',
              title: 'Company Intro',
              language: { code: 'en', name: 'English' },
            },
          ],
        },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockBrochures as any, 1);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      // 핸들러 내부에서 한국어만 필터링
      expect(result.items[0].translations).toHaveLength(1);
      expect(result.items[0].translations[0].language.code).toBe('ko');
    });

    it('결과가 없을 때 빈 배열을 반환해야 한다', async () => {
      // Given
      const query = new GetBrochureListQuery(undefined, 'order', 1, 10);

      const mockQueryBuilder = createMockQueryBuilder([], 0);
      mockBrochureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });
  });
});
