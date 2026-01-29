import { Test, TestingModule } from '@nestjs/testing';
import { VideoGalleryContextService } from '@context/video-gallery-context/video-gallery-context.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';

describe('VideoGalleryContextService', () => {
  let service: VideoGalleryContextService;
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
        VideoGalleryContextService,
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

    service = module.get<VideoGalleryContextService>(
      VideoGalleryContextService,
    );
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('비디오갤러리_목록을_조회한다', () => {
    it('GetVideoGalleryListQuery를 실행해야 한다', async () => {
      // Given
      const isPublic = true;
      const orderBy = 'order';
      const page = 1;
      const limit = 10;

      const mockResult = {
        items: [
          {
            id: 'gallery-1',
            title: '비디오갤러리 1',
            isPublic: true,
          } as VideoGallery,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.비디오갤러리_목록을_조회한다(
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
            id: 'gallery-1',
            categoryId: 'category-1',
            title: '비디오갤러리 1',
            isPublic: true,
          } as VideoGallery,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.비디오갤러리_목록을_조회한다(
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
      await service.비디오갤러리_목록을_조회한다(
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
});
