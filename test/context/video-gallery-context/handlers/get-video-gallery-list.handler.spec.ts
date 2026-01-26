import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GetVideoGalleryListHandler,
  GetVideoGalleryListQuery,
} from '@context/video-gallery-context/handlers/queries/get-video-gallery-list.handler';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';

describe('GetVideoGalleryListHandler', () => {
  let handler: GetVideoGalleryListHandler;
  let videoGalleryRepository: jest.Mocked<Repository<VideoGallery>>;

  const mockVideoGalleryRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVideoGalleryListHandler,
        {
          provide: getRepositoryToken(VideoGallery),
          useValue: mockVideoGalleryRepository,
        },
      ],
    }).compile();

    handler = module.get<GetVideoGalleryListHandler>(
      GetVideoGalleryListHandler,
    );
    videoGalleryRepository = module.get(getRepositoryToken(VideoGallery));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('비디오갤러리 목록을 조회해야 한다', async () => {
      // Given
      const query = new GetVideoGalleryListQuery(
        undefined,
        'order',
        1,
        10,
        undefined,
        undefined,
      );

      const mockVideoGalleries = [
        {
          id: 'video-gallery-1',
          title: '비디오 1',
          isPublic: true,
          order: 0,
          category: { id: 'cat-1', name: '제품 소개' },
        },
        {
          id: 'video-gallery-2',
          title: '비디오 2',
          isPublic: true,
          order: 1,
          category: { id: 'cat-2', name: '회사 소개' },
        },
      ] as VideoGallery[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([mockVideoGalleries, 2]),
      };

      mockVideoGalleryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(videoGalleryRepository.createQueryBuilder).toHaveBeenCalledWith(
        'videoGallery',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'videoGallery.category',
        'category',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'videoGallery.order',
        'ASC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        items: mockVideoGalleries,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('공개된 비디오갤러리만 조회해야 한다', async () => {
      // Given
      const query = new GetVideoGalleryListQuery(true, 'order', 1, 10);

      const mockVideoGalleries = [
        {
          id: 'video-gallery-1',
          isPublic: true,
          order: 0,
        },
      ] as VideoGallery[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([mockVideoGalleries, 1]),
      };

      mockVideoGalleryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await handler.execute(query);

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'videoGallery.isPublic = :isPublic',
        { isPublic: true },
      );
    });

    it('생성일 기준으로 정렬해야 한다', async () => {
      // Given
      const query = new GetVideoGalleryListQuery(
        undefined,
        'createdAt',
        1,
        10,
      );

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockVideoGalleryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await handler.execute(query);

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'videoGallery.createdAt',
        'DESC',
      );
    });

    it('날짜 필터를 포함하여 조회해야 한다', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const query = new GetVideoGalleryListQuery(
        undefined,
        'order',
        1,
        10,
        startDate,
        endDate,
      );

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockVideoGalleryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await handler.execute(query);

      // Then
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'videoGallery.createdAt >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'videoGallery.createdAt <= :endDate',
        { endDate },
      );
    });

    it('페이지네이션을 적용해야 한다', async () => {
      // Given
      const query = new GetVideoGalleryListQuery(undefined, 'order', 2, 5);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockVideoGalleryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // When
      await handler.execute(query);

      // Then
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (2 - 1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });
});
