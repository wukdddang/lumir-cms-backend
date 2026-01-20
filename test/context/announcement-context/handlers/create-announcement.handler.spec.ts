import { Test, TestingModule } from '@nestjs/testing';
import { CreateAnnouncementHandler } from '@context/announcement-context/handlers/commands/create-announcement.handler';
import { AnnouncementService } from '@domain/core/announcement/announcement.service';
import { Announcement } from '@domain/core/announcement/announcement.entity';

describe('CreateAnnouncementHandler', () => {
  let handler: CreateAnnouncementHandler;
  let announcementService: jest.Mocked<AnnouncementService>;

  const mockAnnouncementService = {
    공지사항을_생성한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAnnouncementHandler,
        {
          provide: AnnouncementService,
          useValue: mockAnnouncementService,
        },
      ],
    }).compile();

    handler = module.get<CreateAnnouncementHandler>(CreateAnnouncementHandler);
    announcementService = module.get(AnnouncementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('공지사항 서비스를 호출하여 공지사항을 생성해야 한다', async () => {
      // Given
      const command = {
        data: {
          title: '새 공지사항',
          content: '새 내용',
          isPublic: true,
          isFixed: false,
          mustRead: false,
          createdBy: 'user-1',
        },
      };

      const mockCreatedAnnouncement = {
        id: 'new-announcement-1',
        isPublic: true,
        isFixed: false,
        order: 0,
        createdAt: new Date(),
      };

      mockAnnouncementService.공지사항을_생성한다.mockResolvedValue(mockCreatedAnnouncement as any);

      // When
      const result = await handler.execute(command as any);

      // Then
      expect(announcementService.공지사항을_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          title: command.data.title,
          content: command.data.content,
          isPublic: command.data.isPublic,
          isFixed: command.data.isFixed,
          mustRead: command.data.mustRead,
          createdBy: command.data.createdBy,
        }),
      );
      expect(result).toEqual(mockCreatedAnnouncement);
    });

    it('첨부파일이 있는 공지사항을 생성해야 한다', async () => {
      // Given
      const command = {
        data: {
          title: '첨부파일 공지',
          content: '첨부파일 포함',
          isPublic: true,
          isFixed: false,
          mustRead: false,
          attachments: [
            {
              fileName: 'test.pdf',
              fileUrl: 'https://example.com/test.pdf',
              fileSize: 1024,
              mimeType: 'application/pdf',
            },
          ],
          createdBy: 'user-1',
        },
      };

      const mockCreatedAnnouncement = {
        id: 'new-announcement-1',
        isPublic: true,
        isFixed: false,
        order: 0,
        createdAt: new Date(),
      } as any;

      mockAnnouncementService.공지사항을_생성한다.mockResolvedValue(mockCreatedAnnouncement);

      // When
      const result = await handler.execute(command as any);

      // Then
      expect(announcementService.공지사항을_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          title: command.data.title,
          content: command.data.content,
          attachments: command.data.attachments,
        }),
      );
      expect(result.id).toBe('new-announcement-1');
    });

    it('권한 정보가 있는 공지사항을 생성해야 한다', async () => {
      // Given
      const command = {
        data: {
          title: '제한 공지',
          content: '특정 부서만',
          isPublic: false,
          isFixed: false,
          mustRead: true,
          permissionDepartmentIds: ['dept-1'],
          permissionRankIds: ['rank-1'],
          createdBy: 'user-1',
        },
      };

      const mockCreatedAnnouncement = {
        id: 'new-announcement-1',
        isPublic: false,
        isFixed: false,
        order: 0,
        createdAt: new Date(),
      } as any;

      mockAnnouncementService.공지사항을_생성한다.mockResolvedValue(mockCreatedAnnouncement);

      // When
      const result = await handler.execute(command as any);

      // Then
      expect(announcementService.공지사항을_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          title: command.data.title,
          content: command.data.content,
          permissionDepartmentIds: command.data.permissionDepartmentIds,
          permissionRankIds: command.data.permissionRankIds,
        }),
      );
      expect(result.isPublic).toBe(false);
    });
  });
});
