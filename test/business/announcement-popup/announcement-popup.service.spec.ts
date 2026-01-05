import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementPopupService } from '@business/announcement-popup/announcement-popup.service';
import { AnnouncementPopup } from '@domain/core/announcement-popup/announcement-popup.entity';
import { AnnouncementPopupFixture } from '../../fixtures';

describe('AnnouncementPopupService', () => {
  let service: AnnouncementPopupService;
  let repository: jest.Mocked<Repository<AnnouncementPopup>>;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementPopupService,
        {
          provide: getRepositoryToken(AnnouncementPopup),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnnouncementPopupService>(AnnouncementPopupService);
    repository = module.get(getRepositoryToken(AnnouncementPopup));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('팝업_목록을_조회_한다', () => {
    it('모든 팝업을 조회해야 한다', async () => {
      // Given
      const popups = AnnouncementPopupFixture.여러_팝업을_생성한다(3);
      repository.find.mockResolvedValue(popups);

      // When
      const result = await service.팝업_목록을_조회_한다();

      // Then
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['manager'],
        order: {
          createdAt: 'DESC',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.message).toBe('팝업 목록을 성공적으로 조회했습니다.');
    });

    it('팝업이 없으면 빈 배열을 반환해야 한다', async () => {
      // Given
      repository.find.mockResolvedValue([]);

      // When
      const result = await service.팝업_목록을_조회_한다();

      // Then
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('manager 관계를 포함하여 조회해야 한다', async () => {
      // Given
      const popups = AnnouncementPopupFixture.여러_팝업을_생성한다(1);
      repository.find.mockResolvedValue(popups);

      // When
      await service.팝업_목록을_조회_한다();

      // Then
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['manager'],
        }),
      );
    });

    it('생성일 기준 내림차순으로 정렬되어야 한다', async () => {
      // Given
      const popups = AnnouncementPopupFixture.여러_팝업을_생성한다(2);
      repository.find.mockResolvedValue(popups);

      // When
      await service.팝업_목록을_조회_한다();

      // Then
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: {
            createdAt: 'DESC',
          },
        }),
      );
    });
  });

  describe('팝업을_조회_한다', () => {
    it('ID로 팝업을 조회해야 한다', async () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      repository.findOne.mockResolvedValue(popup);

      // When
      const result = await service.팝업을_조회_한다(popup.id);

      // Then
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: popup.id },
        relations: ['manager'],
      });
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(popup.id);
      expect(result.message).toBe('팝업 정보를 성공적으로 조회했습니다.');
    });

    it('존재하지 않는 ID로 조회 시 에러를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      repository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.팝업을_조회_한다(nonExistentId)).rejects.toThrow(
        `팝업을 찾을 수 없습니다. ID: ${nonExistentId}`,
      );
    });
  });

  describe('팝업을_생성_한다', () => {
    it('새로운 팝업을 생성해야 한다', async () => {
      // Given
      const newPopupData = {
        title: '새 팝업',
        status: 'draft' as const,
        isPublic: false,
      };
      const createdPopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다(
        newPopupData,
      );
      repository.create.mockReturnValue(createdPopup);
      repository.save.mockResolvedValue(createdPopup);

      // When
      const result = await service.팝업을_생성_한다(newPopupData);

      // Then
      expect(repository.create).toHaveBeenCalledWith(newPopupData);
      expect(repository.save).toHaveBeenCalledWith(createdPopup);
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(newPopupData.title);
      expect(result.message).toBe('팝업이 성공적으로 생성되었습니다.');
    });

    it('save 결과가 배열이면 첫 번째 요소를 반환해야 한다', async () => {
      // Given
      const newPopupData = { title: '새 팝업' };
      const createdPopup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      repository.create.mockReturnValue(createdPopup);
      repository.save.mockResolvedValue([createdPopup] as any);

      // When
      const result = await service.팝업을_생성_한다(newPopupData);

      // Then
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('팝업을_수정_한다', () => {
    it('기존 팝업을 수정해야 한다', async () => {
      // Given
      const existingPopup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      const updateData = {
        title: '수정된 제목',
        status: 'approved' as const,
      };
      const updatedPopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
        ...existingPopup,
        ...updateData,
      });

      repository.findOne.mockResolvedValue(existingPopup);
      repository.save.mockResolvedValue(updatedPopup);

      // When
      const result = await service.팝업을_수정_한다(
        existingPopup.id,
        updateData,
      );

      // Then
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: existingPopup.id },
        relations: ['manager'],
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(updateData.title);
      expect(result.message).toBe('팝업이 성공적으로 수정되었습니다.');
    });

    it('존재하지 않는 팝업 수정 시 에러를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      repository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.팝업을_수정_한다(nonExistentId, { title: '수정' }),
      ).rejects.toThrow(`팝업을 찾을 수 없습니다. ID: ${nonExistentId}`);
    });

    it('부분 업데이트가 가능해야 한다', async () => {
      // Given
      const existingPopup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      const updateData = { title: '제목만 수정' };
      const updatedPopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
        ...existingPopup,
        ...updateData,
      });

      repository.findOne.mockResolvedValue(existingPopup);
      repository.save.mockResolvedValue(updatedPopup);

      // When
      const result = await service.팝업을_수정_한다(
        existingPopup.id,
        updateData,
      );

      // Then
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(updateData.title);
      // 다른 필드는 유지되어야 함
      expect(result.data.status).toBe(existingPopup.status);
    });
  });

  describe('팝업을_삭제_한다', () => {
    it('팝업을 소프트 삭제해야 한다', async () => {
      // Given
      const popupId = '550e8400-e29b-41d4-a716-446655440100';
      repository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);

      // When
      const result = await service.팝업을_삭제_한다(popupId);

      // Then
      expect(repository.softDelete).toHaveBeenCalledWith(popupId);
      expect(result.success).toBe(true);
      expect(result.message).toBe('팝업이 성공적으로 삭제되었습니다.');
    });

    it('존재하지 않는 팝업 삭제 시 에러를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      repository.softDelete.mockResolvedValue({ affected: 0, raw: {} } as any);

      // When & Then
      await expect(service.팝업을_삭제_한다(nonExistentId)).rejects.toThrow(
        `팝업을 찾을 수 없습니다. ID: ${nonExistentId}`,
      );
    });

    it('affected가 0이면 에러를 발생시켜야 한다', async () => {
      // Given
      const popupId = '550e8400-e29b-41d4-a716-446655440100';
      repository.softDelete.mockResolvedValue({ affected: 0, raw: {} } as any);

      // When & Then
      await expect(service.팝업을_삭제_한다(popupId)).rejects.toThrow();
    });
  });

  describe('팝업을_공개_한다', () => {
    it('팝업을 공개 상태로 변경해야 한다', async () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      const publicPopup = AnnouncementPopupFixture.공개_팝업을_생성한다();

      repository.findOne.mockResolvedValue(popup);
      repository.save.mockResolvedValue(publicPopup);

      // When
      const result = await service.팝업을_공개_한다(popup.id);

      // Then
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: popup.id },
        relations: ['manager'],
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.isPublic).toBe(true);
      expect(result.data.releasedAt).toBeDefined();
      expect(result.message).toBe('팝업이 성공적으로 공개되었습니다.');
    });

    it('존재하지 않는 팝업 공개 시 에러를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      repository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.팝업을_공개_한다(nonExistentId)).rejects.toThrow(
        `팝업을 찾을 수 없습니다. ID: ${nonExistentId}`,
      );
    });
  });

  describe('팝업을_비공개_한다', () => {
    it('팝업을 비공개 상태로 변경해야 한다', async () => {
      // Given
      const publicPopup = AnnouncementPopupFixture.공개_팝업을_생성한다();
      const privatePopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
        ...publicPopup,
        isPublic: false,
      });

      repository.findOne.mockResolvedValue(publicPopup);
      repository.save.mockResolvedValue(privatePopup);

      // When
      const result = await service.팝업을_비공개_한다(publicPopup.id);

      // Then
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: publicPopup.id },
        relations: ['manager'],
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.isPublic).toBe(false);
      expect(result.message).toBe('팝업이 성공적으로 비공개되었습니다.');
    });

    it('존재하지 않는 팝업 비공개 시 에러를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      repository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.팝업을_비공개_한다(nonExistentId)).rejects.toThrow(
        `팝업을 찾을 수 없습니다. ID: ${nonExistentId}`,
      );
    });
  });

  describe('에러 처리', () => {
    it('데이터베이스 에러를 적절히 전파해야 한다', async () => {
      // Given
      const dbError = new Error('Database connection failed');
      repository.find.mockRejectedValue(dbError);

      // When & Then
      await expect(service.팝업_목록을_조회_한다()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
