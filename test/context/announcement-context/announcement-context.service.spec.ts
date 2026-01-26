import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AnnouncementContextService } from '@context/announcement-context/announcement-context.service';
import { AnnouncementService } from '@domain/core/announcement/announcement.service';
import { Announcement } from '@domain/core/announcement/announcement.entity';

describe('AnnouncementContextService', () => {
  let service: AnnouncementContextService;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockAnnouncementService = {
    공지사항을_생성한다: jest.fn(),
    공지사항을_수정한다: jest.fn(),
    공지사항을_삭제한다: jest.fn(),
    공지사항을_조회한다: jest.fn(),
    공지사항_목록을_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementContextService,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: AnnouncementService,
          useValue: mockAnnouncementService,
        },
      ],
    }).compile();

    service = module.get<AnnouncementContextService>(AnnouncementContextService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('공지사항을_생성한다', () => {
    it('CreateAnnouncementCommand를 실행해야 한다', async () => {
      // Given
      const createDto = {
        categoryId: 'category-uuid-1',
        title: '새 공지사항',
        content: '새 내용',
        isPublic: true,
        isFixed: false,
        mustRead: false,
        createdBy: 'user-1',
      };

      const mockResult = {
        id: 'new-announcement-1',
        ...createDto,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항을_생성한다(createDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: createDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('공지사항을_수정한다', () => {
    it('UpdateAnnouncementCommand를 실행해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const updateDto = {
        categoryId: 'category-1',
        title: '수정된 제목',
        content: '수정된 내용',
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: announcementId,
        ...updateDto,
      } as Announcement;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항을_수정한다(announcementId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: announcementId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('공지사항_공개를_수정한다', () => {
    it('UpdateAnnouncementPublicCommand를 실행해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const updateDto = {
        isPublic: true,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: announcementId,
        isPublic: true,
      } as Announcement;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항_공개를_수정한다(announcementId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: announcementId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('공지사항_고정을_수정한다', () => {
    it('UpdateAnnouncementFixedCommand를 실행해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const updateDto = {
        isFixed: true,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: announcementId,
        isFixed: true,
      } as Announcement;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항_고정을_수정한다(announcementId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: announcementId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('공지사항_오더를_수정한다', () => {
    it('UpdateAnnouncementOrderCommand를 실행해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const updateDto = {
        order: 5,
        updatedBy: 'user-1',
      };

      const mockResult = {
        id: announcementId,
        order: 5,
      } as Announcement;

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항_오더를_수정한다(announcementId, updateDto);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: announcementId,
          data: updateDto,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('공지사항_오더를_일괄_수정한다', () => {
    it('UpdateAnnouncementBatchOrderCommand를 실행해야 한다', async () => {
      // Given
      const batchOrderDto = {
        announcements: [
          { id: 'announcement-1', order: 0 },
          { id: 'announcement-2', order: 1 },
        ],
        updatedBy: 'user-1',
      };

      const mockResult = {
        success: true,
        updatedCount: 2,
      };

      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항_오더를_일괄_수정한다(batchOrderDto);

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

  describe('공지사항을_삭제한다', () => {
    it('DeleteAnnouncementCommand를 실행해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      mockCommandBus.execute.mockResolvedValue(true);

      // When
      const result = await service.공지사항을_삭제한다(announcementId);

      // Then
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: announcementId,
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('공지사항_목록을_조회한다', () => {
    it('GetAnnouncementListQuery를 실행해야 한다', async () => {
      // Given
      const params = {
        isPublic: true,
        isFixed: false,
        orderBy: 'order' as const,
        page: 1,
        limit: 10,
      };

      const mockResult = {
        items: [
          {
            id: 'announcement-1',
            title: '테스트 공지',
            content: '테스트 내용',
          } as Announcement,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항_목록을_조회한다(params);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      // GetAnnouncementListQuery는 params 객체를 직접 전달받습니다
      expect(result).toEqual(mockResult);
    });

    it('선택적 파라미터 없이 조회할 수 있어야 한다', async () => {
      // Given
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.공지사항_목록을_조회한다({});

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('공지사항을_조회한다', () => {
    it('GetAnnouncementDetailQuery를 실행해야 한다', async () => {
      // Given
      const announcementId = 'announcement-1';
      const mockAnnouncement = {
        id: announcementId,
        title: '테스트 공지',
        content: '테스트 내용',
        isPublic: true,
        isFixed: false,
        mustRead: false,
        categoryId: 'category-1',
        category: {
          name: '일반 공지',
        },
      } as Announcement;

      mockQueryBus.execute.mockResolvedValue(mockAnnouncement);

      // When
      const result = await service.공지사항을_조회한다(announcementId);

      // Then
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: announcementId,
        }),
      );
      expect(result).toEqual(mockAnnouncement);
      expect(result.categoryId).toBe('category-1');
      expect(result.category?.name).toBe('일반 공지');
    });
  });
});
