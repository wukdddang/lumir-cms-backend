import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';

/**
 * MigrationUser Entity (마이그레이션된 사용자 정보)
 *
 * MongoDB에서 마이그레이션된 사용자 데이터
 * 독립적인 테이블로 존재하며, 추후 기능 추가 시 확장 가능
 */
@Entity('migration_users')
export class MigrationUser extends BaseEntity<MigrationUser> {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: '계정 ID',
  })
  accountId: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '암호화된 비밀번호',
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '사용자 이름',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '이메일 주소',
  })
  email: string | null;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): MigrationUser {
    return this;
  }
}
