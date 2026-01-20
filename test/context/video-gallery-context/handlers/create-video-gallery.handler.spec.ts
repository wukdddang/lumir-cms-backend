import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateVideoGalleryHandler,
  CreateVideoGalleryCommand,
} from '@context/video-gallery-context/handlers/commands/create-video-gallery.handler';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';

describe('CreateVideoGalleryHandler', () => {
  let handler: CreateVideoGalleryHandler;
  let videoGalleryService: jest.Mocked<VideoGalleryService>;

  const mockVideoGalleryService = {
    비디오갤러리를_생성한다: jest.fn(),
    다음_순서를_계산한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVideoGalleryHandler,
        {
          provide: VideoGalleryService,
          useValue: mockVideoGalleryService,
        },
      ],
    }).compile();

    handler = module.get<CreateVideoGalleryHandler>(CreateVideoGalleryHandler);
    videoGalleryService = module.get(VideoGalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('비디오갤러리를 생성해야 한다', async () => {
      // Given
      const command = new CreateVideoGalleryCommand({
        title: '비디오 갤러리 제목',
        description: '비디오 갤러리 설명',
        createdBy: 'user-1',
      });

      const mockVideoGallery = {
        id: 'video-gallery-1',
        title: command.data.title,
        description: command.data.description,
        isPublic: true,
        order: 0,
        videoSources: null,
        createdAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.다음_순서를_계산한다.mockResolvedValue(0);
      mockVideoGalleryService.비디오갤러리를_생성한다.mockResolvedValue(
        mockVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(videoGalleryService.다음_순서를_계산한다).toHaveBeenCalled();
      expect(videoGalleryService.비디오갤러리를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          title: command.data.title,
          description: command.data.description,
          isPublic: true,
          order: 0,
          createdBy: 'user-1',
        }),
      );
      expect(result).toMatchObject({
        id: 'video-gallery-1',
        isPublic: true,
        order: 0,
      });
    });

    it('비디오 소스가 있는 비디오갤러리를 생성해야 한다', async () => {
      // Given
      const command = new CreateVideoGalleryCommand({
        title: '비디오 갤러리 제목',
        description: '비디오 갤러리 설명',
        videoSources: [
          {
            url: 'https://www.youtube.com/watch?v=abc123',
            type: 'youtube',
          },
          {
            url: 'https://s3.aws.com/video.mp4',
            type: 'upload',
            title: 'video.mp4',
          },
        ],
        createdBy: 'user-1',
      });

      const mockVideoGallery = {
        id: 'video-gallery-1',
        title: command.data.title,
        description: command.data.description,
        isPublic: true,
        order: 0,
        videoSources: command.data.videoSources,
        createdAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.다음_순서를_계산한다.mockResolvedValue(0);
      mockVideoGalleryService.비디오갤러리를_생성한다.mockResolvedValue(
        mockVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(videoGalleryService.비디오갤러리를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          videoSources: command.data.videoSources,
        }),
      );
      expect(result.id).toBe('video-gallery-1');
    });

    it('order를 자동으로 계산해야 한다', async () => {
      // Given
      const command = new CreateVideoGalleryCommand({
        title: '비디오 갤러리 제목',
        description: '비디오 갤러리 설명',
        createdBy: 'user-1',
      });

      const mockVideoGallery = {
        id: 'video-gallery-1',
        isPublic: true,
        order: 5, // 계산된 order
        createdAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.다음_순서를_계산한다.mockResolvedValue(5);
      mockVideoGalleryService.비디오갤러리를_생성한다.mockResolvedValue(
        mockVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(videoGalleryService.다음_순서를_계산한다).toHaveBeenCalled();
      expect(videoGalleryService.비디오갤러리를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          order: 5,
        }),
      );
      expect(result.order).toBe(5);
    });

    it('기본적으로 공개 상태로 생성해야 한다', async () => {
      // Given
      const command = new CreateVideoGalleryCommand({
        title: '비디오 갤러리 제목',
        createdBy: 'user-1',
      });

      const mockVideoGallery = {
        id: 'video-gallery-1',
        isPublic: true,
        order: 0,
        createdAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.다음_순서를_계산한다.mockResolvedValue(0);
      mockVideoGalleryService.비디오갤러리를_생성한다.mockResolvedValue(
        mockVideoGallery,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(videoGalleryService.비디오갤러리를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: true,
        }),
      );
      expect(result.isPublic).toBe(true);
    });
  });
});
