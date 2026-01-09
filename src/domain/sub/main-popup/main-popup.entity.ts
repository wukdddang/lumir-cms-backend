import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ContentStatus } from '../../core/content-status.types';
import { MainPopupTranslation } from './main-popup-translation.entity';

/**
 * MainPopup Entity (메인 팝업)
 * 
 * 메인 페이지 팝업 관리
 * 다국어 지원: MainPopupTranslation
 */
@Entity('main_popups')
@Index('idx_main_popup_status', ['status'])
@Index('idx_main_popup_is_public', ['isPublic'])
@Index('idx_main_popup_released_at', ['releasedAt'])
@Index('idx_main_popup_order', ['order'])
export class MainPopup extends BaseEntity<MainPopup> {
  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
    comment: '상태 (draft|approved|under_review|rejected|opened)',
  })
  status: ContentStatus;

  @Column({
    type: 'boolean',
    default: true,
    comment: '공개 여부',
  })
  isPublic: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '공개 일시',
  })
  releasedAt: Date | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '첨부파일 목록 (AWS S3 URLs) - 파일명으로 언어 구분 (예: popup_image_ko.jpg)',
  })
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }> | null;

  @Column({
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  order: number;

  @OneToMany(
    () => MainPopupTranslation,
    (translation) => translation.mainPopup,
    { cascade: true },
  )
  translations: MainPopupTranslation[];

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): MainPopup {
    return this;
  }
}
