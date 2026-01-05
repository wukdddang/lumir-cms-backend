import { AnnouncementPopup } from '@domain/core/announcement-popup/announcement-popup.entity';
import { AnnouncementPopupFixture } from '../../../fixtures';
import { ContentStatus } from '@domain/core/common/types/status.types';

describe('AnnouncementPopup Entity', () => {
  describe('생성자', () => {
    it('모든 필드가 제공되면 정상적으로 생성되어야 한다', () => {
      // Given
      const title = '테스트 팝업';
      const status = ContentStatus.DRAFT;
      const isPublic = false;
      const category = AnnouncementPopupFixture.기본_카테고리를_생성한다();
      const language = AnnouncementPopupFixture.기본_언어를_생성한다();
      const manager = null as any; // 테스트용 null
      const tags = AnnouncementPopupFixture.기본_태그_목록을_생성한다();
      const attachments = ['https://s3.amazonaws.com/file.pdf'];
      const releasedAt = new Date();

      // When
      const popup = new AnnouncementPopup(
        title,
        status,
        isPublic,
        category,
        language,
        manager,
        tags,
        attachments,
        releasedAt,
      );

      // Then
      expect(popup.title).toBe(title);
      expect(popup.status).toBe(status);
      expect(popup.isPublic).toBe(isPublic);
      expect(popup.category).toEqual(category);
      expect(popup.language).toEqual(language);
      expect(popup.tags).toEqual(tags);
      expect(popup.attachments).toEqual(attachments);
      expect(popup.releasedAt).toEqual(releasedAt);
    });

    it('선택적 필드 없이 생성할 수 있어야 한다', () => {
      // When
      const popup = new AnnouncementPopup();

      // Then
      expect(popup).toBeDefined();
      expect(popup.title).toBeUndefined();
      expect(popup.status).toBeUndefined();
    });
  });

  describe('DTO로_변환한다', () => {
    it('엔티티를 DTO로 정상적으로 변환해야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

      // When
      const dto = popup.DTO로_변환한다();

      // Then
      expect(dto).toMatchObject({
        id: popup.id,
        title: popup.title,
        status: popup.status,
        isPublic: popup.isPublic,
        category: popup.category,
        language: popup.language,
        tags: popup.tags,
        attachments: popup.attachments,
      });

      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);
    });

    it('manager가 있으면 manager DTO도 포함되어야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

      // When
      const dto = popup.DTO로_변환한다();

      // Then
      expect(dto.manager).toBeDefined();
      expect(dto.manager.id).toBe(popup.manager.id);
      expect(dto.manager.name).toBe(popup.manager.name);
    });

    it('isDeleted getter가 올바르게 동작해야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

      // When
      const dto = popup.DTO로_변환한다();

      // Then
      expect(dto.isDeleted).toBe(false);
    });

    it('deletedAt이 설정되면 isDeleted가 true여야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      popup.deletedAt = new Date();

      // When
      const dto = popup.DTO로_변환한다();

      // Then
      expect(dto.isDeleted).toBe(true);
    });

    it('isNew getter가 올바르게 동작해야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

      // When & Then
      popup.version = 1;
      expect(popup.DTO로_변환한다().isNew).toBe(true);

      popup.version = 2;
      expect(popup.DTO로_변환한다().isNew).toBe(false);
    });

    it('isReleased getter가 올바르게 동작해야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

      // When & Then
      expect(popup.DTO로_변환한다().isReleased).toBe(false);

      popup.releasedAt = new Date();
      expect(popup.DTO로_변환한다().isReleased).toBe(true);
    });
  });

  describe('공개한다', () => {
    it('팝업을 공개 상태로 변경해야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      expect(popup.isPublic).toBe(false);
      expect(popup.releasedAt).toBeUndefined();

      // When
      popup.공개한다();

      // Then
      expect(popup.isPublic).toBe(true);
      expect(popup.releasedAt).toBeInstanceOf(Date);
    });

    it('releasedAt이 현재 시간으로 설정되어야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      const beforeTime = new Date();

      // When
      popup.공개한다();

      // Then
      const afterTime = new Date();
      expect(popup.releasedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(popup.releasedAt!.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe('비공개한다', () => {
    it('팝업을 비공개 상태로 변경해야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.공개_팝업을_생성한다();
      expect(popup.isPublic).toBe(true);

      // When
      popup.비공개한다();

      // Then
      expect(popup.isPublic).toBe(false);
    });

    it('releasedAt은 그대로 유지되어야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.공개_팝업을_생성한다();
      const originalReleasedAt = popup.releasedAt;

      // When
      popup.비공개한다();

      // Then
      expect(popup.releasedAt).toEqual(originalReleasedAt);
    });
  });

  describe('상태를_변경한다', () => {
    it('상태를 변경할 수 있어야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      expect(popup.status).toBe(ContentStatus.DRAFT);

      // When
      popup.상태를_변경한다(ContentStatus.APPROVED);

      // Then
      expect(popup.status).toBe(ContentStatus.APPROVED);
    });

    it('여러 상태로 순차적으로 변경할 수 있어야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

      // When & Then
      popup.상태를_변경한다(ContentStatus.UNDER_REVIEW);
      expect(popup.status).toBe(ContentStatus.UNDER_REVIEW);

      popup.상태를_변경한다(ContentStatus.APPROVED);
      expect(popup.status).toBe(ContentStatus.APPROVED);

      popup.상태를_변경한다(ContentStatus.OPENED);
      expect(popup.status).toBe(ContentStatus.OPENED);
    });
  });

  describe('비즈니스 규칙', () => {
    it('공개된 팝업은 isPublic이 true이고 releasedAt이 설정되어야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

      // When
      popup.공개한다();

      // Then
      expect(popup.isPublic).toBe(true);
      expect(popup.releasedAt).toBeDefined();
    });

    it('여러 번 공개해도 releasedAt이 계속 갱신되어야 한다', async () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      popup.공개한다();
      const firstReleasedAt = popup.releasedAt;

      // When
      await new Promise((resolve) => setTimeout(resolve, 10));
      popup.공개한다();

      // Then
      expect(popup.releasedAt).not.toEqual(firstReleasedAt);
      expect(popup.releasedAt!.getTime()).toBeGreaterThan(
        firstReleasedAt!.getTime(),
      );
    });

    it('비공개 후 다시 공개할 수 있어야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.공개_팝업을_생성한다();

      // When
      popup.비공개한다();
      expect(popup.isPublic).toBe(false);

      popup.공개한다();

      // Then
      expect(popup.isPublic).toBe(true);
      expect(popup.releasedAt).toBeDefined();
    });
  });
});
