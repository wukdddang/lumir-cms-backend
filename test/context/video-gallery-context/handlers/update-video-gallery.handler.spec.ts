import { Test, TestingModule } from '@nestjs/testing';
import {
  UpdateVideoGalleryHandler,
  UpdateVideoGalleryCommand,
} from '@context/video-gallery-context/handlers/commands/update-video-gallery.handler';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';

describe('UpdateVideoGalleryHandler', () => {
  let handler: UpdateVideoGalleryHandler;
  let videoGalleryService: jest.Mocked<VideoGalleryService>;

  const mockVideoGalleryService = {
    비디오갤러리를_업데이트한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVideoGalleryHandler,
        {
          provide: VideoGalleryService,
          useValue: mockVideoGalleryService,
        },
      ],
    }).compile();

    handler = module.get<UpdateVideoGalleryHandler>(UpdateVideoGalleryHandler);
    videoGalleryService = module.get(VideoGalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('비디오갤러리를 수정해야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const command = new UpdateVideoGalleryCommand(videoGalleryId, {
        title: '수정된 제목',
        description: '수정된 설명',
        updatedBy: 'user-1',
      });

      const mockUpdatedVideoGallery = {
        id: videoGalleryId,
        title: '수정된 제목',
        description: '수정된 설명',
        isPublic: true,
        order: 0,
        updatedAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.비디오갤러리를_업데이트한다.mockResolvedValue(
        mockUpdatedVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(
        videoGalleryService.비디오갤러리를_업데이트한다,
      ).toHaveBeenCalledWith(videoGalleryId, {
        title: '수정된 제목',
        description: '수정된 설명',
        updatedBy: 'user-1',
      });
      expect(result).toMatchObject({
        id: videoGalleryId,
        title: '수정된 제목',
        description: '수정된 설명',
      });
    });

    it('제목만 수정할 수 있어야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const command = new UpdateVideoGalleryCommand(videoGalleryId, {
        title: '새로운 제목',
        updatedBy: 'user-1',
      });

      const mockUpdatedVideoGallery = {
        id: videoGalleryId,
        title: '새로운 제목',
        description: '기존 설명',
        updatedAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.비디오갤러리를_업데이트한다.mockResolvedValue(
        mockUpdatedVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(
        videoGalleryService.비디오갤러리를_업데이트한다,
      ).toHaveBeenCalledWith(videoGalleryId, {
        title: '새로운 제목',
        updatedBy: 'user-1',
      });
      expect(result.title).toBe('새로운 제목');
    });

    it('설명을 null로 설정할 수 있어야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const command = new UpdateVideoGalleryCommand(videoGalleryId, {
        description: null,
        updatedBy: 'user-1',
      });

      const mockUpdatedVideoGallery = {
        id: videoGalleryId,
        title: '기존 제목',
        description: null,
        updatedAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.비디오갤러리를_업데이트한다.mockResolvedValue(
        mockUpdatedVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.description).toBeNull();
    });
  });
});
