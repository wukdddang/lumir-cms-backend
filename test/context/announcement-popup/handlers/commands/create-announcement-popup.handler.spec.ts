import { Test, TestingModule } from '@nestjs/testing';
import { CreateAnnouncementPopupHandler } from '@context/announcement-popup/handlers/commands/create-announcement-popup.handler';
import { CreateAnnouncementPopupCommand } from '@context/announcement-popup/commands/create-announcement-popup.command';
import { AnnouncementPopupService } from '@business/announcement-popup/announcement-popup.service';
import { AnnouncementPopupFixture } from '../../../../fixtures';
import { successResponse } from '@domain/common/types/api-response.types';

describe('CreateAnnouncementPopupHandler', () => {
  let handler: CreateAnnouncementPopupHandler;
  let popupService: jest.Mocked<AnnouncementPopupService>;

  beforeEach(async () => {
    const mockPopupService = {
      팝업을_생성_한다: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAnnouncementPopupHandler,
        {
          provide: AnnouncementPopupService,
          useValue: mockPopupService,
        },
      ],
    }).compile();

    handler = module.get<CreateAnnouncementPopupHandler>(
      CreateAnnouncementPopupHandler,
    );
    popupService = module.get(AnnouncementPopupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('CreateAnnouncementPopupCommand를 실행하여 팝업을 생성해야 한다', async () => {
      // Given
      const command = new CreateAnnouncementPopupCommand(
        '새 팝업',
        'category-001',
        false,
        [],
        undefined,
      );

      const createdPopup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      const response = successResponse(
        createdPopup.DTO로_변환한다(),
        '팝업이 성공적으로 생성되었습니다.',
      );

      popupService.팝업을_생성_한다.mockResolvedValue(response);

      // When
      const result = await handler.execute(command);

      // Then
      expect(popupService.팝업을_생성_한다).toHaveBeenCalledWith({
        title: command.title,
        categoryId: command.categoryId,
        isPublic: command.isPublic,
        attachments: command.attachments,
        releasedAt: command.releasedAt,
      });
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('테스트 팝업 제목');
    });

    it('최소한의 필드만으로 팝업을 생성할 수 있어야 한다', async () => {
      // Given
      const command = new CreateAnnouncementPopupCommand('필수 제목만');

      const createdPopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
        title: '필수 제목만',
      });
      const response = successResponse(
        createdPopup.DTO로_변환한다(),
        '팝업이 성공적으로 생성되었습니다.',
      );

      popupService.팝업을_생성_한다.mockResolvedValue(response);

      // When
      const result = await handler.execute(command);

      // Then
      expect(popupService.팝업을_생성_한다).toHaveBeenCalledWith({
        title: '필수 제목만',
        categoryId: undefined,
        isPublic: undefined,
        attachments: undefined,
        releasedAt: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('모든 선택적 필드를 포함하여 팝업을 생성할 수 있어야 한다', async () => {
      // Given
      const command = new CreateAnnouncementPopupCommand(
        '완전한 팝업',
        'category-001',
        true,
        ['https://s3.amazonaws.com/file1.pdf'],
        new Date('2025-01-01'),
      );

      const createdPopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
        title: '완전한 팝업',
        isPublic: true,
        attachments: ['https://s3.amazonaws.com/file1.pdf'],
        releasedAt: new Date('2025-01-01'),
      });
      const response = successResponse(
        createdPopup.DTO로_변환한다(),
        '팝업이 성공적으로 생성되었습니다.',
      );

      popupService.팝업을_생성_한다.mockResolvedValue(response);

      // When
      const result = await handler.execute(command);

      // Then
      expect(popupService.팝업을_생성_한다).toHaveBeenCalledWith({
        title: '완전한 팝업',
        categoryId: 'category-001',
        isPublic: true,
        attachments: ['https://s3.amazonaws.com/file1.pdf'],
        releasedAt: new Date('2025-01-01'),
      });
      expect(result.success).toBe(true);
    });

    it('Service에서 발생한 에러를 전파해야 한다', async () => {
      // Given
      const command = new CreateAnnouncementPopupCommand('에러 테스트');
      const error = new Error('팝업 생성 실패');
      popupService.팝업을_생성_한다.mockRejectedValue(error);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow('팝업 생성 실패');
    });
  });
});
