import { Test, TestingModule } from '@nestjs/testing';
import { DeleteAnnouncementPopupHandler } from '@context/announcement-popup/handlers/commands/delete-announcement-popup.handler';
import { DeleteAnnouncementPopupCommand } from '@context/announcement-popup/commands/delete-announcement-popup.command';
import { AnnouncementPopupService } from '@business/announcement-popup/announcement-popup.service';
import { successResponse } from '@domain/common/types/api-response.types';

describe('DeleteAnnouncementPopupHandler', () => {
  let handler: DeleteAnnouncementPopupHandler;
  let popupService: jest.Mocked<AnnouncementPopupService>;

  beforeEach(async () => {
    const mockPopupService = {
      팝업을_삭제_한다: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAnnouncementPopupHandler,
        {
          provide: AnnouncementPopupService,
          useValue: mockPopupService,
        },
      ],
    }).compile();

    handler = module.get<DeleteAnnouncementPopupHandler>(
      DeleteAnnouncementPopupHandler,
    );
    popupService = module.get(AnnouncementPopupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('DeleteAnnouncementPopupCommand를 실행하여 팝업을 삭제해야 한다', async () => {
      // Given
      const popupId = '550e8400-e29b-41d4-a716-446655440100';
      const command = new DeleteAnnouncementPopupCommand(popupId);

      const response = successResponse(
        undefined as any,
        '팝업이 성공적으로 삭제되었습니다.',
      );

      popupService.팝업을_삭제_한다.mockResolvedValue(response);

      // When
      const result = await handler.execute(command);

      // Then
      expect(popupService.팝업을_삭제_한다).toHaveBeenCalledWith(popupId);
      expect(result.success).toBe(true);
      expect(result.message).toBe('팝업이 성공적으로 삭제되었습니다.');
    });

    it('Service에서 발생한 에러를 전파해야 한다', async () => {
      // Given
      const command = new DeleteAnnouncementPopupCommand('non-existent-id');
      const error = new Error('팝업을 찾을 수 없습니다');
      popupService.팝업을_삭제_한다.mockRejectedValue(error);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        '팝업을 찾을 수 없습니다',
      );
    });
  });
});
