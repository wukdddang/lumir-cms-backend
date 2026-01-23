import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * News Entity (뉴스)
 *
 * 언론 보도 및 뉴스 관리
 * 다국어 지원: 없음
 */
@Entity('news')
@Index('idx_news_is_public', ['isPublic'])
@Index('idx_news_order', ['order'])
@Index('idx_news_category_id', ['categoryId'])
export class News extends BaseEntity<News> {
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
    type: 'text',
    nullable: true,
    comment: '외부 링크 또는 상세 페이지 URL',
  })
  url: string | null;

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

  @Column({
    type: 'uuid',
    nullable: false,
    comment: '뉴스 카테고리 ID',
  })
  categoryId: string;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): News {
    return this;
  }
}
