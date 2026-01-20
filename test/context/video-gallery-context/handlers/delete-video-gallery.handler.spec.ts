import { Test, TestingModule } from '@nestjs/testing';
import {
  DeleteVideoGalleryHandler,
  DeleteVideoGalleryCommand,
} from '@context/video-gallery-context/handlers/commands/delete-video-gallery.handler';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';

describe('DeleteVideoGalleryHandler', () => {
  let handler: DeleteVideoGalleryHandler;
  let videoGalleryService: jest.Mocked<VideoGalleryService>;

  const mockVideoGalleryService = {
    비디오갤러리를_삭제한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteVideoGalleryHandler,
        {
          provide: VideoGalleryService,
          useValue: mockVideoGalleryService,
        },
      ],
    }).compile();

    handler = module.get<DeleteVideoGalleryHandler>(DeleteVideoGalleryHandler);
    videoGalleryService = module.get(VideoGalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('비디오갤러리를 삭제해야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const command = new DeleteVideoGalleryCommand(videoGalleryId);

      mockVideoGalleryService.비디오갤러리를_삭제한다.mockResolvedValue(true);

      // When
      const result = await handler.execute(command);

      // Then
      expect(videoGalleryService.비디오갤러리를_삭제한다).toHaveBeenCalledWith(
        videoGalleryId,
      );
      expect(result).toBe(true);
    });

    it('삭제 실패 시 false를 반환해야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const command = new DeleteVideoGalleryCommand(videoGalleryId);

      mockVideoGalleryService.비디오갤러리를_삭제한다.mockResolvedValue(
        false,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toBe(false);
    });
  });
});
