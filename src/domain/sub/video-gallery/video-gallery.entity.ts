import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ContentStatus } from '../../core/content-status.types';

/**
 * VideoGallery Entity (비디오 갤러리)
 * 
 * 비디오 콘텐츠 관리
 * 다국어 지원: 없음
 */
@Entity('video_galleries')
@Index('idx_video_gallery_status', ['status'])
@Index('idx_video_gallery_is_public', ['isPublic'])
@Index('idx_video_gallery_order', ['order'])
export class VideoGallery extends BaseEntity<VideoGallery> {
  @Column({
    type: 'varchar',
    length: 500,
    comment: '제목',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '설명',
  })
  description: string | null;

  @Column({
    type: 'boolean',
    default: true,
    comment: '공개 여부',
  })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
    comment: '상태 (draft|approved|under_review|rejected|opened)',
  })
  status: ContentStatus;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '비디오 소스 목록 (업로드 파일 S3 URL + YouTube URL 통합)',
  })
  videoSources: Array<{
    url: string;
    type: 'upload' | 'youtube';
    title?: string;
    thumbnailUrl?: string;
  }> | null;

  @Column({
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  order: number;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): VideoGallery {
    return this;
  }
}
