import { Test, TestingModule } from '@nestjs/testing';
import { UpdateAnnouncementPopupHandler } from '@context/announcement-popup/handlers/commands/update-announcement-popup.handler';
import { UpdateAnnouncementPopupCommand } from '@context/announcement-popup/commands/update-announcement-popup.command';
import { AnnouncementPopupService } from '@business/announcement-popup/announcement-popup.service';
import { AnnouncementPopupFixture } from '../../../../fixtures';
import { successResponse } from '@domain/common/types/api-response.types';

describe('UpdateAnnouncementPopupHandler', () => {
  let handler: UpdateAnnouncementPopupHandler;
  let popupService: jest.Mocked<AnnouncementPopupService>;

  beforeEach(async () => {
    const mockPopupService = {
      팝업을_수정_한다: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAnnouncementPopupHandler,
        {
          provide: AnnouncementPopupService,
          useValue: mockPopupService,
        },
      ],
    }).compile();

    handler = module.get<UpdateAnnouncementPopupHandler>(
      UpdateAnnouncementPopupHandler,
    );
    popupService = module.get(AnnouncementPopupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('UpdateAnnouncementPopupCommand를 실행하여 팝업을 수정해야 한다', async () => {
      // Given
      const popupId = '550e8400-e29b-41d4-a716-446655440100';
      const command = new UpdateAnnouncementPopupCommand(
        popupId,
        '수정된 제목',
        undefined,
        undefined,
        undefined,
        undefined,
      );

      const updatedPopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
        title: '수정된 제목',
      });
      const response = successResponse(
        updatedPopup.DTO로_변환한다(),
        '팝업이 성공적으로 수정되었습니다.',
      );

      popupService.팝업을_수정_한다.mockResolvedValue(response);

      // When
      const result = await handler.execute(command);

      // Then
      expect(popupService.팝업을_수정_한다).toHaveBeenCalledWith(popupId, {
        title: '수정된 제목',
        categoryId: undefined,
        isPublic: undefined,
        attachments: undefined,
        releasedAt: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('부분 업데이트가 가능해야 한다', async () => {
      // Given
      const popupId = '550e8400-e29b-41d4-a716-446655440100';
      const command = new UpdateAnnouncementPopupCommand(
        popupId,
        undefined,
        undefined,
        true, // isPublic만 수정
        undefined,
        undefined,
      );

      const updatedPopup = AnnouncementPopupFixture.공개_팝업을_생성한다();
      const response = successResponse(
        updatedPopup.DTO로_변환한다(),
        '팝업이 성공적으로 수정되었습니다.',
      );

      popupService.팝업을_수정_한다.mockResolvedValue(response);

      // When
      const result = await handler.execute(command);

      // Then
      expect(popupService.팝업을_수정_한다).toHaveBeenCalledWith(popupId, {
        title: undefined,
        categoryId: undefined,
        isPublic: true,
        attachments: undefined,
        releasedAt: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('Service에서 발생한 에러를 전파해야 한다', async () => {
      // Given
      const command = new UpdateAnnouncementPopupCommand(
        'non-existent-id',
        '수정',
      );
      const error = new Error('팝업을 찾을 수 없습니다');
      popupService.팝업을_수정_한다.mockRejectedValue(error);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        '팝업을 찾을 수 없습니다',
      );
    });
  });
});
