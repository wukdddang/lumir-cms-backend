import { Test, TestingModule } from '@nestjs/testing';
import {
  UpdateVideoGalleryPublicHandler,
  UpdateVideoGalleryPublicCommand,
} from '@context/video-gallery-context/handlers/commands/update-video-gallery-public.handler';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';

describe('UpdateVideoGalleryPublicHandler', () => {
  let handler: UpdateVideoGalleryPublicHandler;
  let videoGalleryService: jest.Mocked<VideoGalleryService>;

  const mockVideoGalleryService = {
    비디오갤러리_공개_여부를_변경한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVideoGalleryPublicHandler,
        {
          provide: VideoGalleryService,
          useValue: mockVideoGalleryService,
        },
      ],
    }).compile();

    handler = module.get<UpdateVideoGalleryPublicHandler>(
      UpdateVideoGalleryPublicHandler,
    );
    videoGalleryService = module.get(VideoGalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('비디오갤러리를 공개로 변경해야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const command = new UpdateVideoGalleryPublicCommand(videoGalleryId, {
        isPublic: true,
        updatedBy: 'user-1',
      });

      const mockUpdatedVideoGallery = {
        id: videoGalleryId,
        title: '비디오 갤러리',
        isPublic: true,
        updatedAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.비디오갤러리_공개_여부를_변경한다.mockResolvedValue(
        mockUpdatedVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(
        videoGalleryService.비디오갤러리_공개_여부를_변경한다,
      ).toHaveBeenCalledWith(videoGalleryId, true, 'user-1');
      expect(result.isPublic).toBe(true);
    });

    it('비디오갤러리를 비공개로 변경해야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const command = new UpdateVideoGalleryPublicCommand(videoGalleryId, {
        isPublic: false,
        updatedBy: 'user-1',
      });

      const mockUpdatedVideoGallery = {
        id: videoGalleryId,
        title: '비디오 갤러리',
        isPublic: false,
        updatedAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.비디오갤러리_공개_여부를_변경한다.mockResolvedValue(
        mockUpdatedVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(
        videoGalleryService.비디오갤러리_공개_여부를_변경한다,
      ).toHaveBeenCalledWith(videoGalleryId, false, 'user-1');
      expect(result.isPublic).toBe(false);
    });
  });
});
