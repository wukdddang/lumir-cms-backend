import { Test, TestingModule } from '@nestjs/testing';
import {
  GetVideoGalleryDetailHandler,
  GetVideoGalleryDetailQuery,
} from '@context/video-gallery-context/handlers/queries/get-video-gallery-detail.handler';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';
import { VideoGallery } from '@domain/sub/video-gallery/video-gallery.entity';
import { NotFoundException } from '@nestjs/common';

describe('GetVideoGalleryDetailHandler', () => {
  let handler: GetVideoGalleryDetailHandler;
  let videoGalleryService: jest.Mocked<VideoGalleryService>;

  const mockVideoGalleryService = {
    ID로_비디오갤러리를_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVideoGalleryDetailHandler,
        {
          provide: VideoGalleryService,
          useValue: mockVideoGalleryService,
        },
      ],
    }).compile();

    handler = module.get<GetVideoGalleryDetailHandler>(
      GetVideoGalleryDetailHandler,
    );
    videoGalleryService = module.get(VideoGalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('비디오갤러리 상세 정보를 조회해야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const query = new GetVideoGalleryDetailQuery(videoGalleryId);

      const mockVideoGallery = {
        id: videoGalleryId,
        title: '비디오 갤러리',
        description: '설명',
        isPublic: true,
        order: 0,
        videoSources: [
          {
            url: 'https://www.youtube.com/watch?v=abc123',
            type: 'youtube',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any as VideoGallery;

      mockVideoGalleryService.ID로_비디오갤러리를_조회한다.mockResolvedValue(
        mockVideoGallery,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(
        videoGalleryService.ID로_비디오갤러리를_조회한다,
      ).toHaveBeenCalledWith(videoGalleryId);
      expect(result).toMatchObject({
        id: videoGalleryId,
        title: '비디오 갤러리',
        description: '설명',
        isPublic: true,
        order: 0,
      });
    });

    it('비디오 소스 정보를 포함해야 한다', async () => {
      // Given
      const videoGalleryId = 'video-gallery-1';
      const query = new GetVideoGalleryDetailQuery(videoGalleryId);

      const mockVideoGallery = {
        id: videoGalleryId,
        title: '비디오 갤러리',
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
      } as any as VideoGallery;

      mockVideoGalleryService.ID로_비디오갤러리를_조회한다.mockResolvedValue(
        mockVideoGallery,
      );

      // When
      const result = await handler.execute(query);

      // Then
      expect(result.videoSources).toHaveLength(2);
      expect(result.videoSources[0].type).toBe('youtube');
      expect(result.videoSources[1].type).toBe('upload');
    });

    it('존재하지 않는 비디오갤러리 조회 시 NotFoundException을 발생시켜야 한다', async () => {
      // Given
      const videoGalleryId = 'non-existent-id';
      const query = new GetVideoGalleryDetailQuery(videoGalleryId);

      mockVideoGalleryService.ID로_비디오갤러리를_조회한다.mockRejectedValue(
        new NotFoundException(
          `비디오갤러리를 찾을 수 없습니다. ID: ${videoGalleryId}`,
        ),
      );

      // When & Then
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
    });
  });
});
