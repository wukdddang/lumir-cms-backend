import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * LumirStory Entity (루미르 스토리)
 *
 * 회사 스토리 및 콘텐츠 관리
 * 다국어 지원: 없음
 */
@Entity('lumir_stories')
@Index('idx_lumir_story_is_public', ['isPublic'])
@Index('idx_lumir_story_order', ['order'])
export class LumirStory extends BaseEntity<LumirStory> {
  @Column({
    type: 'varchar',
    length: 500,
    comment: '제목',
  })
  title: string;

  @Column({
    type: 'text',
    comment: '내용',
  })
  content: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '카테고리 ID (선택)',
  })
  @Index('idx_lumir_story_category_id')
  categoryId: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: '썸네일/대표 이미지 URL (AWS S3)',
  })
  imageUrl: string | null;

  @Column({
    type: 'boolean',
    default: true,
    comment: '공개 여부',
  })
  isPublic: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '첨부파일 목록 (AWS S3 URLs)',
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

  // TypeORM 조인 시 임시로 담기 위한 필드 (DB 컬럼이 아님)
  category?: {
    name: string;
  };

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): LumirStory {
    return this;
  }
}
