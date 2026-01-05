import { AnnouncementPopup } from '@domain/core/announcement-popup/announcement-popup.entity';
import type { AnnouncementCategory, Tag } from '@domain/core/common/types';
import {
  ContentStatus,
  type AnnouncementStatus,
} from '@domain/core/common/types/status.types';
import {
  LanguageCode,
  LanguageEnum,
  type Language,
} from '@domain/core/common/types/language.types';
import { EmployeeFixture } from './employee.fixture';

/**
 * 테스트용 공지사항 팝업 픽스처
 */
export class AnnouncementPopupFixture {
  /**
   * 기본 카테고리를 생성한다
   */
  static 기본_카테고리를_생성한다(): AnnouncementCategory {
    return {
      id: 'category-001',
      name: '일반 공지',
      description: '일반적인 공지사항',
    };
  }

  /**
   * 기본 언어를 생성한다
   */
  static 기본_언어를_생성한다(): Language {
    return {
      code: LanguageCode.KOREAN,
      label: '한국어',
      name: LanguageEnum.KOREAN,
    };
  }

  /**
   * 기본 태그 목록을 생성한다
   */
  static 기본_태그_목록을_생성한다(): Tag[] {
    return [
      {
        id: 'tag-001',
        name: '긴급',
        description: '긴급 공지',
      },
      {
        id: 'tag-002',
        name: '중요',
        description: '중요 공지',
      },
    ];
  }

  /**
   * 초안 상태의 팝업을 생성한다
   */
  static 초안_팝업을_생성한다(): AnnouncementPopup {
    const popup = new AnnouncementPopup(
      '테스트 팝업 제목',
      ContentStatus.DRAFT,
      false,
      this.기본_카테고리를_생성한다(),
      this.기본_언어를_생성한다(),
      EmployeeFixture.기본_직원을_생성한다(),
      this.기본_태그_목록을_생성한다(),
      [],
    );

    popup.id = '550e8400-e29b-41d4-a716-446655440100';
    popup.createdAt = new Date();
    popup.updatedAt = new Date();
    popup.version = 1;

    return popup;
  }

  /**
   * 공개된 팝업을 생성한다
   */
  static 공개_팝업을_생성한다(): AnnouncementPopup {
    const popup = this.초안_팝업을_생성한다();
    popup.status = ContentStatus.OPENED;
    popup.isPublic = true;
    popup.releasedAt = new Date();
    return popup;
  }

  /**
   * 첨부파일이 있는 팝업을 생성한다
   */
  static 첨부파일_포함_팝업을_생성한다(): AnnouncementPopup {
    const popup = this.초안_팝업을_생성한다();
    popup.attachments = [
      'https://s3.amazonaws.com/bucket/file1.pdf',
      'https://s3.amazonaws.com/bucket/file2.pdf',
    ];
    return popup;
  }

  /**
   * 커스텀 팝업을 생성한다
   */
  static 커스텀_팝업을_생성한다(
    partial: Partial<AnnouncementPopup>,
  ): AnnouncementPopup {
    const popup = this.초안_팝업을_생성한다();
    Object.assign(popup, partial);
    return popup;
  }

  /**
   * 여러 팝업을 생성한다
   */
  static 여러_팝업을_생성한다(count: number): AnnouncementPopup[] {
    return Array.from({ length: count }, (_, index) => {
      const popup = this.초안_팝업을_생성한다();
      popup.id = `550e8400-e29b-41d4-a716-44665544${String(index).padStart(4, '0')}`;
      popup.title = `테스트 팝업 ${index + 1}`;
      return popup;
    });
  }
}
