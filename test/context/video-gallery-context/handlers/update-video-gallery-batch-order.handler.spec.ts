import { Test, TestingModule } from '@nestjs/testing';
import {
  UpdateVideoGalleryBatchOrderHandler,
  UpdateVideoGalleryBatchOrderCommand,
} from '@context/video-gallery-context/handlers/commands/update-video-gallery-batch-order.handler';
import { VideoGalleryService } from '@domain/sub/video-gallery/video-gallery.service';

describe('UpdateVideoGalleryBatchOrderHandler', () => {
  let handler: UpdateVideoGalleryBatchOrderHandler;
  let videoGalleryService: jest.Mocked<VideoGalleryService>;

  const mockVideoGalleryService = {
    비디오갤러리_오더를_일괄_업데이트한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVideoGalleryBatchOrderHandler,
        {
          provide: VideoGalleryService,
          useValue: mockVideoGalleryService,
        },
      ],
    }).compile();

    handler = module.get<UpdateVideoGalleryBatchOrderHandler>(
      UpdateVideoGalleryBatchOrderHandler,
    );
    videoGalleryService = module.get(VideoGalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('여러 비디오갤러리의 오더를 일괄 수정해야 한다', async () => {
      // Given
      const command = new UpdateVideoGalleryBatchOrderCommand({
        videoGalleries: [
          { id: 'video-gallery-1', order: 2 },
          { id: 'video-gallery-2', order: 1 },
          { id: 'video-gallery-3', order: 0 },
        ],
        updatedBy: 'user-1',
      });

      mockVideoGalleryService.비디오갤러리_오더를_일괄_업데이트한다.mockResolvedValue(
        {
          success: true,
          updatedCount: 3,
        },
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(
        videoGalleryService.비디오갤러리_오더를_일괄_업데이트한다,
      ).toHaveBeenCalledWith(
        [
          { id: 'video-gallery-1', order: 2 },
          { id: 'video-gallery-2', order: 1 },
          { id: 'video-gallery-3', order: 0 },
        ],
        'user-1',
      );
      expect(result).toEqual({
        success: true,
        updatedCount: 3,
      });
    });

    it('일부 비디오갤러리 오더 수정 실패 시 실패한 개수를 반환해야 한다', async () => {
      // Given
      const command = new UpdateVideoGalleryBatchOrderCommand({
        videoGalleries: [
          { id: 'video-gallery-1', order: 2 },
          { id: 'invalid-id', order: 1 },
          { id: 'video-gallery-3', order: 0 },
        ],
        updatedBy: 'user-1',
      });

      mockVideoGalleryService.비디오갤러리_오더를_일괄_업데이트한다.mockResolvedValue(
        {
          success: false,
          updatedCount: 2, // 1개는 실패
        },
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toEqual({
        success: false,
        updatedCount: 2,
      });
    });

    it('빈 배열로 호출 시 성공해야 한다', async () => {
      // Given
      const command = new UpdateVideoGalleryBatchOrderCommand({
        videoGalleries: [],
        updatedBy: 'user-1',
      });

      mockVideoGalleryService.비디오갤러리_오더를_일괄_업데이트한다.mockResolvedValue(
        {
          success: true,
          updatedCount: 0,
        },
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result).toEqual({
        success: true,
        updatedCount: 0,
      });
    });
  });
});
