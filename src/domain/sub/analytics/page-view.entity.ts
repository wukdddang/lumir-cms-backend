import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * PageView Entity (페이지 조회 통계)
 *
 * 사용자의 페이지 방문 및 체류 시간 추적
 * 통계 분석용 데이터
 */
@Entity('page_views')
@Index('idx_page_view_session', ['sessionId'])
@Index('idx_page_view_page_name', ['pageName'])
@Index('idx_page_view_enter_time', ['enterTime'])
export class PageView extends BaseEntity<PageView> {
  @Column({
    type: 'varchar',
    length: 255,
    comment: '세션 ID',
  })
  sessionId: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '페이지 이름',
  })
  pageName: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '페이지 타이틀',
  })
  title: string | null;

  @Column({
    type: 'timestamp with time zone',
    comment: '입장 시간',
  })
  enterTime: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '퇴장 시간',
  })
  exitTime: Date | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '체류 시간 (밀리초)',
  })
  stayDuration: number | null;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): PageView {
    return this;
  }
}
